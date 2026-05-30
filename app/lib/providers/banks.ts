import { fetchArrayBuffer, fetchJson } from "./http";
import { formatReceiptTime, matchText, parseAmount, parsePdfText, titleCase, toFailure } from "./parsers";
import type { VerifyResult } from "./types";

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

export async function verifyAbyssinia(reference: string, suffix?: string): Promise<VerifyResult> {
  if (!suffix) return { success: false, error: "Abyssinia requires suffix" };

  try {
    const jsonData = await fetchJson<Record<string, unknown>>(`https://cs.bankofabyssinia.com/api/onlineSlip/getDetails/?id=${reference}${suffix}`);
    console.log("[abyssinia] raw_response", JSON.stringify(jsonData, null, 2));
    const header = jsonData.header as Record<string, unknown> | undefined;
    const body = jsonData.body as Array<Record<string, string>> | undefined;

    if (header?.status !== "success" || !body?.length) {
      return { success: false, error: "Invalid Abyssinia response" };
    }

    const transactionData = body[0];
    return {
      amount: parseAmount(transactionData["Transferred Amount"] || transactionData["Total Amount including VAT"]),
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

export async function verifyCBEBirr(receiptNumber: string, phoneNumber?: string): Promise<VerifyResult> {
  if (!phoneNumber) return { success: false, error: "CBE Birr requires phoneNumber" };

  try {
    const buffer = await fetchArrayBuffer(`https://cbepay1.cbe.com.et/aureceipt?TID=${receiptNumber}&PH=${phoneNumber}`, {
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

export async function verifyDashen(transactionReference: string): Promise<VerifyResult> {
  try {
    const buffer = await fetchArrayBuffer(`https://receipt.dashensuperapp.com/receipt/${transactionReference}`, { accept: "application/pdf", insecureHttps: true });
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

export async function verifyMpesa(transactionId: string): Promise<VerifyResult> {
  try {
    const primaryUrl = `https://m-pesabusiness.safaricom.et/api/receipt/getReceipt?trxNo=${transactionId}`;
    const fallbackUrl = `https://leul.et/mpesa.php?reference=${transactionId}&key=${process.env.MPESA_PROXY_KEY || ""}`;
    let data = await fetchMpesaData(primaryUrl, fallbackUrl);

    console.log("[mpesa] raw_response", JSON.stringify(data, null, 2));
    if (!data || data.responseCode !== "0" || !data.base64Data) return { success: false, error: "Invalid M-Pesa response" };

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

async function fetchMpesaData(primaryUrl: string, fallbackUrl: string) {
  if (process.env.SKIP_PRIMARY_VERIFICATION !== "true") {
    try {
      const data = await fetchJson<Record<string, unknown>>(primaryUrl, { Referer: "https://m-pesabusiness.safaricom.et/" });
      if (data.responseCode === "0" && data.base64Data) return data;
    } catch (error) {
      console.log("[mpesa] primary_failed", error);
    }
  }

  return fetchJson<Record<string, unknown>>(fallbackUrl, { Referer: "https://m-pesabusiness.safaricom.et/" });
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
