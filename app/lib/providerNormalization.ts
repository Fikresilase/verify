import { normalizeLocalVerifyResult, type VerifyResult } from "./providerServices";
import type { ExtractedReceipt, Provider } from "./verification";

export function normalizeProviderResponse(provider: Provider, response: Record<string, unknown>): ExtractedReceipt {
  if ("success" in response) {
    return normalizeLocalVerifyResult(provider, response as VerifyResult);
  }

  if (provider === "cbe") {
    return buildNormalized(provider, {
      time: formatReceiptTime(String(response.date || "")),
      transactionNumber: String(response.reference || ""),
      transactionTo: String(response.receiver || ""),
    });
  }

  if (provider === "telebirr") {
    const data = response.data as Record<string, unknown>;
    return buildNormalized(provider, {
      time: formatReceiptTime(String(data.paymentDate || "")),
      transactionNumber: String(data.receiptNo || ""),
      transactionTo: String(data.creditedPartyName || ""),
    });
  }

  if (provider === "dashen") {
    return buildNormalized(provider, {
      transactionNumber: String(response.transactionReference || ""),
      transactionTo: String(response.narrative || ""),
    });
  }

  if (provider === "abyssinia") {
    const data = response.data as Record<string, unknown>;
    return buildNormalized(provider, {
      time: formatReceiptTime(String(data.date || "")),
      transactionNumber: String(data.reference || ""),
      transactionTo: String(data.receiver || ""),
    });
  }

  if (provider === "cbebirr") {
    return buildNormalized(provider, {
      time: formatReceiptTime(String(response.transactionDate || "")),
      transactionNumber: String(response.receiptNumber || response.reference || ""),
      transactionTo: String(response.receiverName || response.creditAccount || ""),
    });
  }

  const data = response.data as Record<string, unknown>;
  return buildNormalized(provider, {
    time: formatReceiptTime(String(data.transactionDate || "")),
    transactionNumber: String(data.receiptNumber || ""),
    transactionTo: String(data.receiver || ""),
  });
}

function buildNormalized(
  provider: Provider,
  values: Pick<ExtractedReceipt, "transactionNumber" | "transactionTo"> & Partial<Pick<ExtractedReceipt, "time">>,
): ExtractedReceipt {
  return {
    accountSuffix: "",
    amount: "",
    provider,
    receiptUrl: "",
    time: values.time || "",
    transactionNumber: values.transactionNumber,
    transactionTo: values.transactionTo,
  };
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

  const slashDateMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (slashDateMatch) {
    const [, day, month, year, hour, minute, second = "00"] = slashDateMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  return value;
}
