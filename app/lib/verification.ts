export type Provider = "cbe" | "telebirr" | "dashen" | "abyssinia" | "cbebirr" | "mpesa";

export type ExtractedReceipt = {
  accountSuffix?: string;
  amount?: string;
  provider: Provider;
  receiptUrl?: string;
  time: string;
  transactionTo: string;
  transactionNumber: string;
};

export type VerificationCheck = {
  key: "provider" | "time" | "transactionTo" | "transactionNumber";
  label: string;
  matched: boolean;
  receiptValue: string;
  verifiedValue: string;
};

export type VerificationResult = {
  checks: VerificationCheck[];
  extracted: ExtractedReceipt;
  isSuccess: boolean;
  normalized: ExtractedReceipt;
  providerResponse: unknown;
};

export const providerLabels: Record<Provider, string> = {
  abyssinia: "Bank of Abyssinia",
  cbe: "CBE",
  cbebirr: "CBE Birr",
  dashen: "Dashen",
  mpesa: "M-Pesa",
  telebirr: "Telebirr",
};

export const providerHints = [
  "Use provider telebirr when the receipt brand is medium green with white.",
  "Use provider abyssinia when the receipt brand is yellow with white.",
  "Use provider cbe for Commercial Bank of Ethiopia bank receipt references.",
  "Use provider cbebirr for CBE Birr mobile money receipts.",
  "Use provider dashen for Dashen Bank Super App receipts.",
  "Use provider mpesa for M-Pesa receipts.",
];

export const extractionJsonSchema = {
  additionalProperties: false,
  properties: {
    time: {
      description: "Receipt payment time formatted exactly as DD-MM-YYYY HH:mm:ss, for example 24-05-2026 17:56:34. Empty string if not visible.",
      type: "string",
    },
    provider: {
      enum: ["cbe", "telebirr", "dashen", "abyssinia", "cbebirr", "mpesa"],
      type: "string",
    },
    accountSuffix: {
      description:
        "Extra suffix needed by some bank receipts. For CBE receipts, extract the account suffix shown after ETB- or at the end of the receiver account, for example MESELE ADDIS KALYU-ETB-7086 means accountSuffix is 7086. Use empty string when not visible or not needed.",
      type: "string",
    },
    amount: {
      description:
        "The actual transaction amount or settled amount visible on the receipt, preserving the currency word if visible. For top-up receipts prefer Settled Amount over Total Paid Amount, for example 300 Birr. Empty string if not visible.",
      type: "string",
    },
    receiptUrl: {
      description:
        "Official receipt URL or QR/link text when visible. For CBE links like https://Mbreciept.cbe.com.et/fHCxyU6x5apPMBgn0D, return the full URL. Empty string if not visible.",
      type: "string",
    },
    transactionNumber: {
      description: "Receipt/reference/transaction number used to verify the payment.",
      type: "string",
    },
    transactionTo: {
      description: "Receiver, credited party, merchant, or account the payment went to.",
      type: "string",
    },
  },
  required: ["provider", "time", "transactionTo", "transactionNumber", "accountSuffix", "receiptUrl", "amount"],
  type: "object",
};

export function compareExtractedToVerified(extracted: ExtractedReceipt, verified: ExtractedReceipt) {
  const checks: VerificationCheck[] = [
    buildExactCheck("provider", "Provider", extracted.provider, verified.provider),
    buildTimeCheck("time", "Time", extracted.time, verified.time),
    buildNameCheck("transactionTo", "Transaction To", extracted.transactionTo, verified.transactionTo),
    buildExactCheck("transactionNumber", "Transaction Number", extracted.transactionNumber, verified.transactionNumber),
  ];

  return {
    checks,
    isSuccess: checks.every((check) => check.matched),
  };
}

function buildTimeCheck(
  key: VerificationCheck["key"],
  label: string,
  receiptValue: string,
  verifiedValue: string,
): VerificationCheck {
  return {
    key,
    label,
    matched: normalizeTimeForCompare(receiptValue) === normalizeTimeForCompare(verifiedValue),
    receiptValue,
    verifiedValue,
  };
}

function buildExactCheck(
  key: VerificationCheck["key"],
  label: string,
  receiptValue: string,
  verifiedValue: string,
): VerificationCheck {
  return {
    key,
    label,
    matched: normalizeForCompare(receiptValue) === normalizeForCompare(verifiedValue),
    receiptValue,
    verifiedValue,
  };
}

function buildNameCheck(
  key: VerificationCheck["key"],
  label: string,
  receiptValue: string,
  verifiedValue: string,
): VerificationCheck {
  const normalizedReceipt = normalizeForCompare(receiptValue);
  const normalizedVerified = normalizeForCompare(verifiedValue);

  return {
    key,
    label,
    matched:
      Boolean(normalizedReceipt) &&
      Boolean(normalizedVerified) &&
      normalizedVerified.includes(normalizedReceipt),
    receiptValue,
    verifiedValue,
  };
}

export function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u1200-\u137f]+/g, "")
    .trim();
}

function normalizeTimeForCompare(value: string) {
  const trimmed = value.trim();
  const yearFirst = trimmed.match(/^(\d{4})[/-](\d{2})[/-](\d{2})[\sT]+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (yearFirst) {
    const [, year, month, day, hour, minute, second = "00"] = yearFirst;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  const dayFirst = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})[\sT]+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dayFirst) {
    const [, day, month, year, hour, minute, second = "00"] = dayFirst;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  return normalizeForCompare(trimmed);
}
