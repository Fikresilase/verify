import type { VerificationResult } from "@/app/lib/verification";

export const demoVerificationResult: VerificationResult = {
  checks: [
    { key: "provider", label: "Provider", matched: true, receiptValue: "telebirr", verifiedValue: "telebirr" },
    { key: "amount", label: "Amount", matched: true, receiptValue: "500 Birr", verifiedValue: "500" },
    { key: "time", label: "Time", matched: true, receiptValue: "24-05-2026 17:56:34", verifiedValue: "24-05-2026 17:56:34" },
    { key: "transactionTo", label: "Transaction To", matched: true, receiptValue: "Resto-A Group", verifiedValue: "Resto-A Group" },
    { key: "transactionNumber", label: "Transaction Number", matched: true, receiptValue: "CE626EJRNS", verifiedValue: "CE626EJRNS" },
  ],
  extracted: {
    amount: "500 Birr",
    provider: "telebirr",
    receiptUrl: "https://transactioninfo.ethiotelecom.et/receipt/CE626EJRNS",
    time: "24-05-2026 17:56:34",
    transactionNumber: "CE626EJRNS",
    transactionTo: "Resto-A Group",
  },
  isSuccess: true,
  normalized: {
    amount: "500",
    provider: "telebirr",
    receiptUrl: "",
    time: "24-05-2026 17:56:34",
    transactionNumber: "CE626EJRNS",
    transactionTo: "Resto-A Group",
  },
  providerResponse: {
    amount: 500,
    receiver: "Resto-A Group",
    reference: "CE626EJRNS",
    success: true,
    time: "24-05-2026 17:56:34",
  },
};
