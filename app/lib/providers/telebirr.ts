import * as cheerio from "cheerio";
import { fetchJson, fetchText } from "./http";
import { extractWithRegex, formatReceiptTime, matchText, parseAmount, toFailure } from "./parsers";
import type { VerifyResult } from "./types";

type TelebirrReceipt = {
  bankName: string;
  creditedPartyAccountNo: string;
  creditedPartyName: string;
  customerNote: string;
  payerName: string;
  payerTelebirrNo: string;
  paymentDate: string;
  receiptNo: string;
  serviceFee: string;
  serviceFeeVAT: string;
  settledAmount: string;
  totalPaidAmount: string;
  transactionStatus: string;
};

export async function verifyTelebirr(reference: string): Promise<VerifyResult> {
  const verifyLeulResult = await verifyTelebirrViaLeul(reference);
  if (verifyLeulResult.success) return verifyLeulResult;

  const primaryUrl = `https://transactioninfo.ethiotelecom.et/receipt/${reference}`;
  const fallbackProxies = (process.env.FALLBACK_PROXIES || "").split(",").map((url) => url.trim()).filter(Boolean);
  const skipPrimary = process.env.SKIP_PRIMARY_VERIFICATION === "true";

  if (!skipPrimary) {
    try {
      const receipt = scrapeTelebirrReceipt(await fetchText(primaryUrl));
      console.log("[telebirr.primary] receipt", receipt);
      if (isUsableTelebirrReceipt(receipt)) return mapTelebirrReceipt(receipt, reference);
    } catch (error) {
      console.log("[telebirr.primary] failed", error);
    }
  }

  for (const proxyUrl of fallbackProxies) {
    try {
      const proxyKey = process.env.TELEBIRR_PROXY_KEY || "";
      const data = await fetchJson<Record<string, unknown>>(`${proxyUrl}${reference}${proxyKey ? `&key=${proxyKey}` : ""}`);
      console.log("[telebirr.proxy] raw_response", JSON.stringify(data, null, 2));
      const parsed = parseTelebirrJson(data);
      if (parsed && isUsableTelebirrReceipt(parsed)) return mapTelebirrReceipt(parsed, reference);
    } catch (error) {
      console.log("[telebirr.proxy] failed", error);
    }
  }

  return { success: false, error: "All Telebirr verification methods failed" };
}

async function verifyTelebirrViaLeul(reference: string): Promise<VerifyResult> {
  const apiKey = process.env.VERIFY_API_KEY;
  const baseUrl = process.env.VERIFY_API_BASE_URL || "https://verifyapi.leulzenebe.pro";
  if (!apiKey) return { success: false, error: "Missing VERIFY_API_KEY for Telebirr proxy verification" };

  try {
    const response = await fetch(`${baseUrl}/verify-telebirr`, {
      body: JSON.stringify({ reference }),
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      method: "POST",
    });

    if (!response.ok) return { success: false, error: `Verify Leul Telebirr HTTP ${response.status}` };

    const payload = await response.json();
    console.log("[telebirr.verify-leul] raw_response", JSON.stringify(payload, null, 2));
    const data = payload.data || payload;

    if (!payload.success && !data.receiptNo) {
      return { success: false, error: "Verify Leul Telebirr returned invalid response" };
    }

    return {
      amount: parseAmount(data.totalPaidAmount || data.settledAmount),
      payer: data.payerName,
      payerAccount: data.payerTelebirrNo,
      receiver: data.creditedPartyName,
      receiverAccount: data.creditedPartyAccountNo,
      reference: data.receiptNo || reference,
      success: true,
      time: formatReceiptTime(data.paymentDate || ""),
    };
  } catch (error) {
    return toFailure(error, "Verify Leul Telebirr verification failed");
  }
}

function mapTelebirrReceipt(receipt: TelebirrReceipt, fallbackReference: string): VerifyResult {
  return {
    amount: parseAmount(receipt.totalPaidAmount || receipt.settledAmount),
    payer: receipt.payerName,
    payerAccount: receipt.payerTelebirrNo,
    receiver: receipt.creditedPartyName,
    receiverAccount: receipt.creditedPartyAccountNo,
    reference: fallbackReference || receipt.receiptNo,
    success: true,
    time: formatReceiptTime(receipt.paymentDate),
  };
}

function isUsableTelebirrReceipt(receipt: TelebirrReceipt) {
  return Boolean(receipt.receiptNo || receipt.paymentDate || receipt.creditedPartyName || receipt.totalPaidAmount || receipt.settledAmount);
}

function scrapeTelebirrReceipt(html: string): TelebirrReceipt {
  const $ = cheerio.load(html);
  const getText = (labelText: string) => extractWithRegex(html, labelText) || $(`td:contains("${labelText}")`).next().text().trim();
  const bankAccountNumberRaw = getText("የባንክ አካውንት ቁጥር/Bank account number");
  let creditedPartyName = getText("የገንዘብ ተቀባይ ስም/Credited Party name");
  let creditedPartyAccountNo = getText("የገንዘብ ተቀባይ ቴሌብር ቁ./Credited party account no");
  let bankName = "";

  if (bankAccountNumberRaw) {
    bankName = creditedPartyName;
    const match = bankAccountNumberRaw.match(/(\d+)\s+(.*)/);
    if (match) {
      creditedPartyAccountNo = match[1].trim();
      creditedPartyName = match[2].trim();
    }
  }

  return {
    bankName,
    creditedPartyAccountNo,
    creditedPartyName,
    customerNote: getText("የደንበኛ መልዕክት/Customer Note"),
    payerName: getText("የከፋይ ስም/Payer Name"),
    payerTelebirrNo: getText("የከፋይ ቴሌብር ቁ./Payer telebirr no."),
    paymentDate: matchText(html, /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/),
    receiptNo: matchText(html, /<td[^>]*class="[^"]*receipttableTd[^"]*receipttableTd2[^"]*"[^>]*>\s*([A-Z0-9]+)\s*<\/td>/i),
    serviceFee: matchText(html, /የአገልግሎት\s+ክፍያ\/Service\s+fee(?!\s+ተ\.እ\.ታ).*?<\/td>\s*<td[^>]*>\s*([\d,]+(?:\.\d+)?\s+Birr)/i),
    serviceFeeVAT: getText("የአገልግሎት ክፍያ ተ.እ.ታ/Service fee VAT"),
    settledAmount: matchText(html, /Settled\s+Amount[\s\S]*?([\d,]+(?:\.\d+)?\s+Birr)/i),
    totalPaidAmount: getText("ጠቅላላ የተከፈለ/Total Paid Amount"),
    transactionStatus: getText("የክፍያው ሁኔታ/transaction status"),
  };
}

function parseTelebirrJson(jsonData: Record<string, unknown>): TelebirrReceipt | null {
  const data = jsonData.data as Partial<TelebirrReceipt> | undefined;
  if (!jsonData.success || !data) return null;

  return {
    bankName: data.bankName || "",
    creditedPartyAccountNo: data.creditedPartyAccountNo || "",
    creditedPartyName: data.creditedPartyName || "",
    customerNote: data.customerNote || "",
    payerName: data.payerName || "",
    payerTelebirrNo: data.payerTelebirrNo || "",
    paymentDate: data.paymentDate || "",
    receiptNo: data.receiptNo || "",
    serviceFee: data.serviceFee || "",
    serviceFeeVAT: data.serviceFeeVAT || "",
    settledAmount: data.settledAmount || "",
    totalPaidAmount: data.totalPaidAmount || "",
    transactionStatus: data.transactionStatus || "",
  };
}
