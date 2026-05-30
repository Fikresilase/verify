import type { ExtractedReceipt, Provider } from "./verification";
import { verifyAbyssinia, verifyCBEBirr, verifyDashen, verifyMpesa } from "./providers/banks";
import { verifyCBE } from "./providers/cbe";
import { verifyTelebirr } from "./providers/telebirr";
import type { VerifyResult } from "./providers/types";

export type { VerifyResult } from "./providers/types";

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
    amount: result.amount ? String(result.amount) : "",
    provider,
    receiptUrl: "",
    time: result.time || "",
    transactionNumber: result.reference || "",
    transactionTo: result.receiver || result.receiverAccount || "",
  };
}
