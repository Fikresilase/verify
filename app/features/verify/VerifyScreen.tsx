"use client";

import type { VerificationResult } from "@/app/lib/verification";
import { useReceiptVerification } from "./useReceiptVerification";
import { VerifyScreenView } from "./VerifyScreenView";

export function VerifyScreen({ onVerified }: { onVerified: (result: VerificationResult) => void }) {
  const state = useReceiptVerification(onVerified);
  return <VerifyScreenView state={state} />;
}
