import https from "https";
import * as cheerio from "cheerio";
import type { ExtractedReceipt, Provider } from "./verification";

export type VerifyResult = {
  amount?: number;
  error?: string;
  payer?: string;
  payerAccount?: string;
  reason?: string | null;
  receiver?: string;
  receiverAccount?: string;
  reference?: string;
  success: boolean;
  time?: string;
};

const browserHeaders = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

export async function verifyWithLocalProvider(
  extracted: ExtractedReceipt,
  extra: { accountSuffix?: string; phoneNumber?: string; suffix?: string },
) {
  if (extracted.provider === "cbe") return verifyCBE(extracted.receiptUrl || extracted.transactionNumber, extra.accountSuffix);
  if (extracted.provider === "telebirr") return verifyTelebirr(extracted.transactionNumber);
  if (extracted.provider === "dashen") return verifyDashen(extracted.transactionNumber);
  if (extracted.provider === "abyssinia") return verifyAbyssinia(extracted.transactionNumber, extra.suffix);
  if (extracted.provider === "cbebirr") return verifyCBEBirr(extracted.transactionNumber, extra.phoneNumber);
  if (extracted.provider === "mpesa") return verifyMpesa(extracted.transactionNumber);

  return { success: false, error: "Unsupported provider" };
}

export function normalizeLocalVerifyResult(provider: Provider, result: VerifyResult): ExtractedReceipt {
  return {
    accountSuffix: "",
    provider,
    receiptUrl: "",
    time: result.time || "",
    transactionNumber: result.reference || "",
    transactionTo: result.receiver || result.receiverAccount || "",
  };
}

async function verifyAbyssinia(reference: string, suffix?: string): Promise<VerifyResult> {
  if (!suffix) return { success: false, error: "Abyssinia requires suffix" };

  try {
    const apiUrl = `https://cs.bankofabyssinia.com/api/onlineSlip/getDetails/?id=${reference}${suffix}`;
    const jsonData = await fetchJson<Record<string, unknown>>(apiUrl);
    console.log("[abyssinia] raw_response", JSON.stringify(jsonData, null, 2));

    const header = jsonData.header as Record<string, unknown> | undefined;
    const body = jsonData.body as Array<Record<string, string>> | undefined;

    if (header?.status !== "success" || !body?.length) {
      return { success: false, error: "Invalid Abyssinia response" };
    }

    const transactionData = body[0];
    const amount = parseAmount(transactionData["Transferred Amount"] || transactionData["Total Amount including VAT"]);

    return {
      amount,
      payer: transactionData["Payer's Name"] || transactionData["Source Account Name"],
      payerAccount: transactionData["Source Account"] || transactionData["Payer's Account"],
      reason: transactionData.Narrative || transactionData["Transaction Type"] || null,
      receiver: transactionData["Receiver's Name"] || transactionData["Beneficiary Name"],
      receiverAccount: transactionData["Receiver's Account"] || transactionData["Beneficiary Account"],
      reference: transactionData["Transaction Reference"] || transactionData["Payment Reference"],
      success: true,
      time: formatReceiptTime(transactionData["Transaction Date"] || ""),
    };
  } catch (error) {
    return toFailure(error, "Failed to verify Abyssinia transaction");
  }
}

async function verifyCBE(reference: string, accountSuffix?: string): Promise<VerifyResult> {
  const token = extractNewCbeToken(reference);

  if (token) return verifyCBENew(token);
  const cleanSuffix = normalizeAccountSuffix(accountSuffix);
  if (!cleanSuffix) return { success: false, error: "Missing accountSuffix for legacy CBE verification" };

  return verifyCBELegacy(reference, cleanSuffix);
}

async function verifyCBENew(token: string): Promise<VerifyResult> {
  try {
    const url = `https://mb.cbe.com.et/api/v1/transactions/public/transaction-detail/${token}`;
    const data = await fetchJson<Record<string, unknown>>(url, {
      Origin: "https://mbreciept.cbe.com.et",
      Referer: "https://mbreciept.cbe.com.et/",
      "x-app-id": process.env.CBE_APP_ID || "d1292e42-7400-49de-a2d3-9731caa4c819",
      "x-app-version": process.env.CBE_APP_VERSION || "0a01980b-9859-1369-8198-59f403820000",
    });
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
      console.log("[cbe.legacy] fetch_failed", {
        error: error instanceof Error ? error.message : error,
        url,
      });
    }
  }

  return {
    success: false,
    error:
      "CBE legacy receipt endpoint rejected the reference/suffix. The visible ETB- suffix may be only the last 4 digits, while CBE sometimes requires a longer account suffix or a receipt QR/token.",
  };
}

async function verifyCBEBirr(receiptNumber: string, phoneNumber?: string): Promise<VerifyResult> {
  if (!phoneNumber) return { success: false, error: "CBE Birr requires phoneNumber" };

  try {
    const url = `https://cbepay1.cbe.com.et/aureceipt?TID=${receiptNumber}&PH=${phoneNumber}`;
    const buffer = await fetchArrayBuffer(url, {
      authorization: process.env.CBE_BIRR_API_KEY ? `Bearer ${process.env.CBE_BIRR_API_KEY}` : undefined,
    });
    const text = await parsePdfText(buffer);
    console.log("[cbebirr] pdf_text", text);
    const receipt = parseCBEBirrReceipt(text);

    if (!receipt) return { success: false, error: "Failed to parse CBE Birr receipt" };

    return {
      amount: parseAmount(receipt.totalPaidAmount || receipt.paidAmount || receipt.amount),
      payer: receipt.customerName,
      reason: receipt.paymentReason,
      receiver: receipt.receiverName || receipt.creditAccount,
      receiverAccount: receipt.creditAccount,
      reference: receipt.receiptNumber || receipt.reference || receipt.orderId,
      success: true,
      time: formatReceiptTime(receipt.transactionDate),
    };
  } catch (error) {
    return toFailure(error, "Failed to verify CBE Birr transaction");
  }
}

async function verifyDashen(transactionReference: string): Promise<VerifyResult> {
  try {
    const url = `https://receipt.dashensuperapp.com/receipt/${transactionReference}`;
    const buffer = await fetchArrayBuffer(url, { accept: "application/pdf", insecureHttps: true });
    const text = await parsePdfText(buffer);
    console.log("[dashen] pdf_text", text);

    const receiver = matchText(text, /Receiver\s*Name\s*:?\s*(.*?)\s+(?:Phone|Institution)/i);
    const transactionAmount = parseAmount(matchText(text, /Transaction\s*Amount\s*(?:ETB|Birr)?\s*([\d,]+\.?\d*)/i));
    const reference = matchText(text, /Transaction\s*Reference\s*:?\s*([A-Z0-9-]+)/i);

    if (!reference || !transactionAmount) return { success: false, error: "Could not extract Dashen required fields" };

    return {
      amount: transactionAmount,
      payer: titleCase(matchText(text, /Sender\s*Name\s*:?\s*(.*?)\s+(?:Sender\s*Account|Account)/i)),
      payerAccount: matchText(text, /Sender\s*Account\s*(?:Number)?\s*:?\s*([A-Z0-9*-]+)/i),
      reason: matchText(text, /Narrative\s*:?\s*(.*?)\s+(?:Receiver|Phone)/i) || null,
      receiver: receiver ? titleCase(receiver) : matchText(text, /Institution\s*Name\s*:?\s*(.*?)\s+(?:Transaction|Reference)/i),
      receiverAccount: matchText(text, /Phone\s*(?:No\.?|Number)?\s*:?\s*([\+\d\-\s]+)/i),
      reference,
      success: true,
      time: formatReceiptTime(matchText(text, /Transaction\s*Date\s*(?:&\s*Time)?\s*:?\s*([\d\/\-,: ]+(?:[APM]{2})?)/i)),
    };
  } catch (error) {
    return toFailure(error, "Failed to verify Dashen transaction");
  }
}

async function verifyMpesa(transactionId: string): Promise<VerifyResult> {
  try {
    const primaryUrl = `https://m-pesabusiness.safaricom.et/api/receipt/getReceipt?trxNo=${transactionId}`;
    const proxyKey = process.env.MPESA_PROXY_KEY || "";
    const fallbackUrl = `https://leul.et/mpesa.php?reference=${transactionId}&key=${proxyKey}`;
    const skipPrimary = process.env.SKIP_PRIMARY_VERIFICATION === "true";
    let data: Record<string, unknown> | null = null;

    if (!skipPrimary) {
      try {
        data = await fetchJson(primaryUrl, { Referer: "https://m-pesabusiness.safaricom.et/" });
      } catch (error) {
        console.log("[mpesa] primary_failed", error);
      }
    }

    if (!data || data.responseCode !== "0" || !data.base64Data) {
      data = await fetchJson(fallbackUrl, { Referer: "https://m-pesabusiness.safaricom.et/" });
    }

    console.log("[mpesa] raw_response", JSON.stringify(data, null, 2));

    if (!data) return { success: false, error: "M-Pesa receipt data was not found" };
    if (data.responseCode !== "0" || !data.base64Data) return { success: false, error: "Invalid M-Pesa response" };

    const text = await parsePdfText(Buffer.from(String(data.base64Data), "base64"));
    console.log("[mpesa] pdf_text", text);

    return {
      amount: parseAmount(matchText(text, /TOTAL\s+([\d,]+\.\d{2})/i)),
      payer: titleCase(matchText(text, /PAYER NAME\s+(.*?)\s+(?:PAYER PHONE|00\d+|Addis Ababa|\+251|የከፋይ ስም)/i)),
      payerAccount: matchText(text, /PAYER PHONE NUMBER\s+(\d+)/i),
      receiver: titleCase(matchText(text, /RECEIVER NAME.*?(?:የተቀባዩ ቢዝነስ ስም)?\s+([A-Za-z\s]+?)\s+\//i)),
      receiverAccount: matchText(text, /RECEIVER NUMBER\s+(\d+)/i),
      reference: matchText(text, /TRANSACTION ID\s+([A-Z0-9]+)/i) || transactionId,
      success: true,
      time: formatReceiptTime(matchText(text, /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/)),
    };
  } catch (error) {
    return toFailure(error, "Failed to verify M-Pesa transaction");
  }
}

async function verifyTelebirr(reference: string): Promise<VerifyResult> {
  const primaryUrl = `https://transactioninfo.ethiotelecom.et/receipt/${reference}`;
  const fallbackProxies = (process.env.FALLBACK_PROXIES || "").split(",").map((url) => url.trim()).filter(Boolean);
  const skipPrimary = process.env.SKIP_PRIMARY_VERIFICATION === "true";

  if (!skipPrimary) {
    try {
      const html = await fetchText(primaryUrl);
      const receipt = scrapeTelebirrReceipt(html);
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

type CBEBirrReceipt = {
  amount: string;
  creditAccount: string;
  customerName: string;
  orderId: string;
  paidAmount: string;
  paymentReason: string;
  receiptNumber: string;
  receiverName: string;
  reference: string;
  totalPaidAmount: string;
  transactionDate: string;
};

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
    settledAmount: matchText(html, /Settled\s+Amount.*?([\d,]+(?:\.\d+)?\s+Birr)/is),
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

function parseCBEBirrReceipt(pdfText: string): CBEBirrReceipt | null {
  const receiptDataMatch = pdfText.match(/([A-Z0-9]{10})(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})([\d.]+)/);
  const financialMatch = pdfText.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+Paid amount/i);
  const customerName = matchText(pdfText, /Sub city:[\s\n]+([A-Z\s]+?)[\s\n]+Wereda\/kebele:/i);
  const creditAccount = matchText(pdfText, /Credit Account\s*([\s\S]*?)(?=\s*Receiver Name)/i);

  if (!customerName && !receiptDataMatch?.[1]) return null;

  return {
    amount: receiptDataMatch?.[3] || "",
    creditAccount,
    customerName,
    orderId: matchText(pdfText, /Order ID\s*([A-Z0-9]+)/i),
    paidAmount: financialMatch?.[1] || "",
    paymentReason: matchText(pdfText, /Payment Channel[\s\n]+([^\n]+)[\s\n]+([^\n]+)[\s\n]+([^\n]+)/i, 2),
    receiptNumber: receiptDataMatch?.[1] || "",
    receiverName: matchText(pdfText, /Receiver Name\s*([\s\S]*?)(?=\s*Order ID)/i),
    reference: matchText(pdfText, /Reference[\s:]*([\s\S]*?)(?=\s*(?:Transaction Details|Receipt Number|የኢትዮጵያ|Commercial Bank))/i).replace(/^[\s:]+|[\s:]+$/g, ""),
    totalPaidAmount: financialMatch?.[4] || "",
    transactionDate: receiptDataMatch?.[2] || "",
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

async function parsePdfText(buffer: Buffer | ArrayBuffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  return parsed.text;
}

async function fetchJson<T>(url: string, headers?: Record<string, string>) {
  const response = await fetch(url, {
    headers: { ...browserHeaders, ...headers },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: browserHeaders });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchArrayBuffer(
  url: string,
  options: { accept?: string; authorization?: string; insecureHttps?: boolean } = {},
) {
  const response = await fetch(url, {
    headers: {
      ...browserHeaders,
      ...(options.accept ? { Accept: options.accept } : {}),
      ...(options.authorization ? { Authorization: options.authorization } : {}),
    },
    // @ts-expect-error Node fetch accepts agent in runtime, Next types do not expose it.
    agent: options.insecureHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function extractNewCbeToken(input: string) {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/^https?:\/\/mbreciept\.cbe\.com\.et\/([A-Za-z0-9]+)\/?$/i);
  if (urlMatch) return urlMatch[1];
  if (!trimmed.toUpperCase().startsWith("FT") && /^[A-Za-z0-9]{15,25}$/.test(trimmed)) return trimmed;
  return null;
}

function extractWithRegex(htmlContent: string, labelPattern: string) {
  const escapedLabel = labelPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedLabel}.*?<\\/td>\\s*<td[^>]*>\\s*([^<]+)`, "i");
  return matchText(htmlContent, pattern);
}

function formatReceiptTime(value: string) {
  if (!value) return "";

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

  const dayFirstMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (dayFirstMatch) {
    const [, day, month, year, rawHour, minute, second = "00", period] = dayFirstMatch;
    let hour = Number(rawHour);
    if (period?.toUpperCase() === "PM" && hour < 12) hour += 12;
    if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${day}-${month}-${year} ${String(hour).padStart(2, "0")}:${minute}:${second}`;
  }

  return value;
}

function normalizeAccountSuffix(value?: string) {
  const digits = value?.match(/\d{4,8}/)?.[0] || "";
  return digits;
}

function matchText(text: string, regex: RegExp, group = 1) {
  return text.match(regex)?.[group]?.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim() || "";
}

function parseAmount(value?: string) {
  const parsed = value ? Number.parseFloat(value.replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function titleCase(str?: string) {
  return str ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "";
}

function toFailure(error: unknown, fallback: string): VerifyResult {
  console.log("[provider.local] error", error);
  return { success: false, error: error instanceof Error ? error.message : fallback };
}
