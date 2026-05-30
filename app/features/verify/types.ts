import type { VerificationResult } from "@/app/lib/verification";

export type LoadingStage = "idle" | "checking_image" | "verifying_transaction";

export type ExtractReceiptResponse =
  | { extracted: VerificationResult["extracted"]; ok: true }
  | { error?: string; ok: false };

export type VerifyReceiptResponse =
  | { ok: true; result: VerificationResult; type: "completed" }
  | { extracted: VerificationResult["extracted"]; ok: true; type: "needs_cbe_suffix" }
  | { error?: string; ok: false };
