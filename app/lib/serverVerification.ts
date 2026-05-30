import {
  compareExtractedToVerified,
  extractionJsonSchema,
  providerHints,
  type ExtractedReceipt,
  type VerificationResult,
} from "./verification";
import { fetchWithTimeout, readTimeoutMs } from "./httpTimeout";
import { verifyWithLocalProvider } from "./providerServices";
import { normalizeProviderResponse } from "./providerNormalization";

const openRouterModel = "qwen/qwen3-vl-8b-instruct";

export async function extractReceiptFromImage(image: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Receipt AI is not configured. Add OPENROUTER_API_KEY in Vercel environment variables.");
  }

  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
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
  }, readTimeoutMs(process.env.OPENROUTER_TIMEOUT_MS, 45000));

  if (!response.ok) {
    throw new Error(`Receipt AI extraction failed with HTTP ${response.status}`);
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("Receipt AI returned an empty response");

  const extracted = JSON.parse(content) as ExtractedReceipt;

  return extracted;
}

export async function callProviderVerification(
  extracted: ExtractedReceipt,
  extra: { accountSuffix?: string; phoneNumber?: string; suffix?: string },
) {
  const providerResponse = await verifyWithLocalProvider(extracted, extra);

  if (!providerResponse.success) {
    throw new Error(providerResponse.error || "Provider verification failed");
  }

  return providerResponse;
}

export type ReceiptVerificationOutcome =
  | { extracted: ExtractedReceipt; type: "needs_cbe_suffix" }
  | { result: VerificationResult; type: "completed" };

export async function verifyExtractedReceipt(
  receipt: ExtractedReceipt,
  extra: { accountSuffix?: string; phoneNumber?: string; receiptUrl?: string; suffix?: string } = {},
): Promise<ReceiptVerificationOutcome> {
  const extracted = {
    ...receipt,
    ...(extra.accountSuffix ? { accountSuffix: extra.accountSuffix } : {}),
    ...(extra.receiptUrl ? { receiptUrl: extra.receiptUrl } : {}),
  };

  if (extra.receiptUrl && extracted.provider === "cbe") {
    extracted.transactionNumber = extra.receiptUrl;
  }

  if (extracted.provider === "cbe" && !extracted.receiptUrl && !extra.accountSuffix) {
    return {
      extracted,
      type: "needs_cbe_suffix",
    };
  }

  try {
    const providerResponse = await callProviderVerification(extracted, {
      accountSuffix: extra.accountSuffix || extracted.accountSuffix,
      phoneNumber: extra.phoneNumber,
      suffix: extra.suffix || extra.accountSuffix || extracted.accountSuffix,
    });
    const normalized = normalizeProviderResponse(extracted.provider, providerResponse);
    const comparison = compareExtractedToVerified(extracted, normalized);

    return {
      result: {
        checks: comparison.checks,
        extracted,
        isSuccess: comparison.isSuccess,
        normalized,
        providerResponse,
      },
      type: "completed",
    };
  } catch (providerError) {
    const errorMessage = providerError instanceof Error ? providerError.message : "Provider verification failed";

    return {
      result: buildProviderFailureResult(extracted, errorMessage),
      type: "completed",
    };
  }
}

function buildProviderFailureResult(extracted: ExtractedReceipt, errorMessage: string): VerificationResult {
  return {
    checks: [
      {
        key: "provider",
        label: "Provider",
        matched: true,
        receiptValue: extracted.provider,
        verifiedValue: extracted.provider,
      },
      {
        key: "amount",
        label: "Amount",
        matched: false,
        receiptValue: extracted.amount || "",
        verifiedValue: errorMessage,
      },
      {
        key: "time",
        label: "Time",
        matched: false,
        receiptValue: extracted.time,
        verifiedValue: errorMessage,
      },
      {
        key: "transactionTo",
        label: "Transaction To",
        matched: false,
        receiptValue: extracted.transactionTo,
        verifiedValue: errorMessage,
      },
      {
        key: "transactionNumber",
        label: "Transaction Number",
        matched: false,
        receiptValue: extracted.transactionNumber,
        verifiedValue: errorMessage,
      },
    ],
    extracted,
    isSuccess: false,
    normalized: {
      accountSuffix: extracted.accountSuffix,
      amount: extracted.amount,
      provider: extracted.provider,
      receiptUrl: extracted.receiptUrl,
      time: "",
      transactionNumber: "",
      transactionTo: "",
    },
    providerResponse: { error: errorMessage },
  };
}
