import { fetchArrayBuffer, fetchJson } from "./http";
import { formatReceiptTime, matchText, normalizeAccountSuffix, parseAmount, parsePdfText, titleCase, toFailure } from "./parsers";
import type { VerifyResult } from "./types";

export async function verifyCBE(reference: string, accountSuffix?: string): Promise<VerifyResult> {
  const token = extractNewCbeToken(reference);
  if (token) return verifyCBENew(token);

  const cleanSuffix = normalizeAccountSuffix(accountSuffix);
  if (!cleanSuffix) return { success: false, error: "Missing accountSuffix for legacy CBE verification" };

  return verifyCBELegacy(reference, cleanSuffix);
}

async function verifyCBENew(token: string): Promise<VerifyResult> {
  try {
    const data = await fetchJson<Record<string, unknown>>(
      `https://mb.cbe.com.et/api/v1/transactions/public/transaction-detail/${token}`,
      {
        Origin: "https://mbreciept.cbe.com.et",
        Referer: "https://mbreciept.cbe.com.et/",
        "x-app-id": process.env.CBE_APP_ID || "d1292e42-7400-49de-a2d3-9731caa4c819",
        "x-app-version": process.env.CBE_APP_VERSION || "0a01980b-9859-1369-8198-59f403820000",
      },
    );
    console.log("[cbe.new] raw_response", JSON.stringify(data, null, 2));

    return {
      amount: parseAmount(String(data.amountCredited || "")),
      payer: String(data.debitAccountHolder || ""),
      payerAccount: String(data.debitAccountNo || ""),
      reason: Array.isArray(data.paymentDetails) ? data.paymentDetails.join(" ") : null,
      receiver: String(data.creditAccountHolder || ""),
      receiverAccount: String(data.creditAccountNo || ""),
      reference: String(data.id || ""),
      success: true,
      time: formatReceiptTime(Array.isArray(data.dateTimes) ? String(data.dateTimes[0] || "") : ""),
    };
  } catch (error) {
    return toFailure(error, "New CBE verification failed");
  }
}

async function verifyCBELegacy(reference: string, accountSuffix: string): Promise<VerifyResult> {
  const fullId = `${reference}${accountSuffix}`;
  const urls = [
    `https://apps.cbe.com.et:100/?id=${fullId}`,
    `https://apps.cbe.com.et:100/?id=${encodeURIComponent(fullId)}`,
    `https://apps.cbe.com.et:100/?id=${reference}`,
  ];

  for (const url of urls) {
    try {
      console.log("[cbe.legacy] fetching_url", url);
      const buffer = await fetchArrayBuffer(url, { accept: "application/pdf", insecureHttps: true });
      return parseCBEReceipt(buffer);
    } catch (error) {
      console.log("[cbe.legacy] fetch_failed", { error: error instanceof Error ? error.message : error, url });
    }
  }

  return {
    success: false,
    error:
      "CBE legacy receipt endpoint rejected the reference/suffix. The visible ETB- suffix may be only the last 4 digits, while CBE sometimes requires a longer account suffix or a receipt QR/token.",
  };
}

async function parseCBEReceipt(buffer: Buffer | ArrayBuffer): Promise<VerifyResult> {
  const rawText = (await parsePdfText(buffer)).replace(/\s+/g, " ").trim();
  console.log("[cbe.legacy] pdf_text", rawText);

  const amount = parseAmount(matchText(rawText, /Transferred Amount\s*:?\s*([\d,]+\.\d{2})\s*ETB/i));
  const reference = matchText(rawText, /Reference No\.?\s*\(VAT Invoice No\)\s*:?\s*([A-Z0-9]+)/i);
  const time = formatReceiptTime(matchText(rawText, /Payment Date & Time\s*:?\s*([\d\/,: ]+[APM]{2})/i));
  const accountMatches = [...rawText.matchAll(/Account\s*:?\s*([A-Z0-9]?\*{4}\d{4})/gi)];

  if (!amount || !reference || !time) return { success: false, error: "Could not extract CBE required fields" };

  return {
    amount,
    payer: titleCase(matchText(rawText, /Payer\s*:?\s*(.*?)\s+Account/i)),
    payerAccount: accountMatches?.[0]?.[1],
    reason: matchText(rawText, /Reason\s*\/\s*Type of service\s*:?\s*(.*?)\s+Transferred Amount/i) || null,
    receiver: titleCase(matchText(rawText, /Receiver\s*:?\s*(.*?)\s+Account/i)),
    receiverAccount: accountMatches?.[1]?.[1],
    reference,
    success: true,
    time,
  };
}

function extractNewCbeToken(input: string) {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/^https?:\/\/mbreciept\.cbe\.com\.et\/([A-Za-z0-9]+)\/?$/i);
  if (urlMatch) return urlMatch[1];
  if (!trimmed.toUpperCase().startsWith("FT") && /^[A-Za-z0-9]{15,25}$/.test(trimmed)) return trimmed;
  return null;
}
