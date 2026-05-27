import { extractionJsonSchema, providerHints, type ExtractedReceipt, type Provider } from "./verification";
import { normalizeLocalVerifyResult, verifyWithLocalProvider, type VerifyResult } from "./providerServices";

const openRouterModel = "qwen/qwen3-vl-8b-instruct";

export async function extractReceiptFromImage(image: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: [
            {
              text: [
                "Extract Ethiopian payment receipt verification fields.",
                "Return only JSON matching the provided schema.",
                "Use empty strings for unreadable fields.",
                "The time field must be formatted as DD-MM-YYYY HH:mm:ss, for example 24-05-2026 17:56:34.",
                "The image may be a banking app screenshot, receipt page, SMS screenshot, or text-message notification.",
                "If it is a text message/SMS and contains any receipt URL, verification URL, or View Receipt link, always extract it into receiptUrl.",
                "Extract amount from the receipt. For Telebirr top-up/payment receipts, prefer Settled Amount over Total Paid Amount when both are visible.",
                "For Telebirr iPhone success screens, use Transaction Time, Transaction To, and Transaction Number exactly from the screen.",
                "For CBE message receipts, extract transactionNumber from transaction ID and accountSuffix from the receiver account suffix after ETB-, for example ETB-7086 means accountSuffix 7086.",
                "For CBE receipts, if a View Receipt link or QR resolves to mbreciept.cbe.com.et, put the full URL in receiptUrl. The token/link is preferred over suffix verification.",
                ...providerHints,
              ].join("\n"),
              type: "text",
            },
            {
              image_url: { url: image },
              type: "image_url",
            },
          ],
          role: "user",
        },
      ],
      model: openRouterModel,
      response_format: {
        json_schema: {
          name: "ethiopian_receipt_extraction",
          schema: extractionJsonSchema,
          strict: true,
        },
        type: "json_schema",
      },
      temperature: 0,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Verification Hub",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("OpenRouter extraction failed");
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  console.log("[vision.extract] raw_openrouter_content", content);
  console.log("[vision.extract] raw_openrouter_response", JSON.stringify(completion, null, 2));

  const extracted = JSON.parse(content) as ExtractedReceipt;
  console.log("[vision.extract] parsed_extracted_receipt", extracted);

  return extracted;
}

export async function callProviderVerification(
  extracted: ExtractedReceipt,
  extra: { accountSuffix?: string; phoneNumber?: string; suffix?: string },
) {
  const providerResponse = await verifyWithLocalProvider(extracted, extra);
  console.log("[verify.provider] provider", extracted.provider);
  console.log("[verify.provider] raw_response", JSON.stringify(providerResponse, null, 2));

  if (!providerResponse.success) {
    throw new Error(providerResponse.error || "Provider verification failed");
  }

  return providerResponse;
}

export function normalizeProviderResponse(provider: Provider, response: Record<string, unknown>): ExtractedReceipt {
  if ("success" in response) {
    return normalizeLocalVerifyResult(provider, response as VerifyResult);
  }

  if (provider === "cbe") {
    return {
      time: formatReceiptTime(String(response.date || "")),
      accountSuffix: "",
      amount: "",
      receiptUrl: "",
      provider,
      transactionNumber: String(response.reference || ""),
      transactionTo: String(response.receiver || ""),
    };
  }

  if (provider === "telebirr") {
    const data = response.data as Record<string, unknown>;

    return {
      time: formatReceiptTime(String(data.paymentDate || "")),
      accountSuffix: "",
      amount: "",
      receiptUrl: "",
      provider,
      transactionNumber: String(data.receiptNo || ""),
      transactionTo: String(data.creditedPartyName || ""),
    };
  }

  if (provider === "dashen") {
    return {
      time: "",
      accountSuffix: "",
      amount: "",
      receiptUrl: "",
      provider,
      transactionNumber: String(response.transactionReference || ""),
      transactionTo: String(response.narrative || ""),
    };
  }

  if (provider === "abyssinia") {
    const data = response.data as Record<string, unknown>;

    return {
      time: formatReceiptTime(String(data.date || "")),
      accountSuffix: "",
      amount: "",
      receiptUrl: "",
      provider,
      transactionNumber: String(data.reference || ""),
      transactionTo: String(data.receiver || ""),
    };
  }

  if (provider === "cbebirr") {
    return {
      time: formatReceiptTime(String(response.transactionDate || "")),
      accountSuffix: "",
      amount: "",
      receiptUrl: "",
      provider,
      transactionNumber: String(response.receiptNumber || response.reference || ""),
      transactionTo: String(response.receiverName || response.creditAccount || ""),
    };
  }

  const data = response.data as Record<string, unknown>;

  return {
    time: formatReceiptTime(String(data.transactionDate || "")),
    accountSuffix: "",
    amount: "",
    receiptUrl: "",
    provider,
    transactionNumber: String(data.receiptNumber || ""),
    transactionTo: String(data.receiver || ""),
  };
}

function formatReceiptTime(value: string) {
  if (!value) {
    return "";
  }

  const dashDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);

  if (dashDateMatch) {
    const [, year, month, day, hour, minute, second = "00"] = dashDateMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  const slashYearFirstMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (slashYearFirstMatch) {
    const [, year, month, day, hour, minute, second = "00"] = slashYearFirstMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  const slashDateMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (slashDateMatch) {
    const [, day, month, year, hour, minute, second = "00"] = slashDateMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  return value;
}
