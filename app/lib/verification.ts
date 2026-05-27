export type Provider = "cbe" | "telebirr" | "dashen" | "abyssinia" | "cbebirr" | "mpesa";

export type ExtractedReceipt = {
  provider: Provider;
  date: string;
  transactionTo: string;
  transactionNumber: string;
};

export type VerificationCheck = {
  key: "provider" | "date" | "transactionTo" | "transactionNumber";
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
    date: {
      description: "Receipt payment date in ISO-like string when visible. Empty string if not visible.",
      type: "string",
    },
    provider: {
      enum: ["cbe", "telebirr", "dashen", "abyssinia", "cbebirr", "mpesa"],
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
  required: ["provider", "date", "transactionTo", "transactionNumber"],
  type: "object",
};

export function compareExtractedToVerified(extracted: ExtractedReceipt, verified: ExtractedReceipt) {
  const checks: VerificationCheck[] = [
    buildCheck("provider", "Provider", extracted.provider, verified.provider),
    buildCheck("date", "Date", extracted.date, verified.date),
    buildCheck("transactionTo", "Transaction To", extracted.transactionTo, verified.transactionTo),
    buildCheck("transactionNumber", "Transaction Number", extracted.transactionNumber, verified.transactionNumber),
  ];

  return {
    checks,
    isSuccess: checks.every((check) => check.matched),
  };
}

function buildCheck(
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

export function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u1200-\u137f]+/g, "")
    .trim();
}
