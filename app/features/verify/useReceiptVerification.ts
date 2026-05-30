"use client";

import { useMemo, useState } from "react";
import type { VerificationResult } from "@/app/lib/verification";
import { demoVerificationResult } from "./demoReceipt";
import { buildFailedResult, compressImage, runReceiptVerification } from "./verificationClient";
import type { LoadingStage } from "./types";

export function useReceiptVerification(onVerified: (result: VerificationResult) => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [previewImage, setPreviewImage] = useState("");
  const [accountSuffix, setAccountSuffix] = useState("");
  const [suffixAccountNumber, setSuffixAccountNumber] = useState("");
  const [pendingExtracted, setPendingExtracted] = useState<VerificationResult["extracted"] | null>(null);
  const [showSuffixPrompt, setShowSuffixPrompt] = useState(false);

  const suffix = useMemo(() => suffixAccountNumber.replace(/\D/g, "").slice(-8), [suffixAccountNumber]);

  async function handleCapture(file: File) {
    setPreviewImage(await compressImage(file));
  }

  async function handleVerify(nextAccountSuffix = accountSuffix) {
    if (!previewImage) return;
    setIsProcessing(true);
    let extracted = pendingExtracted;

    try {
      const result = await runReceiptVerification({
        accountSuffix: nextAccountSuffix,
        extracted,
        image: previewImage,
        onStage: setLoadingStage,
      });
      extracted = result.extracted;
      setPendingExtracted(extracted);

      if (result.payload.type === "needs_cbe_suffix") {
        setPendingExtracted(result.payload.extracted);
        setShowSuffixPrompt(true);
        return;
      }

      setPendingExtracted(null);
      onVerified(result.payload.result);
    } catch (error) {
      onVerified(buildFailedResult(extracted, error instanceof Error ? error.message : "Unable to read receipt"));
    } finally {
      setIsProcessing(false);
      setLoadingStage("idle");
    }
  }

  function handleDemoReceipt() {
    setPreviewImage("");
    setAccountSuffix("");
    setPendingExtracted(null);
    setShowSuffixPrompt(false);
    setSuffixAccountNumber("");
    onVerified(demoVerificationResult);
  }

  function clearReceipt() {
    setPreviewImage("");
    setAccountSuffix("");
    setPendingExtracted(null);
    setShowSuffixPrompt(false);
    setSuffixAccountNumber("");
  }

  function saveSuffix() {
    if (suffix.length < 4) return;
    setAccountSuffix(suffix);
    setShowSuffixPrompt(false);
    void handleVerify(suffix);
  }

  return {
    accountSuffix,
    clearReceipt,
    handleCapture,
    handleDemoReceipt,
    handleVerify,
    isProcessing,
    loadingStage,
    previewImage,
    saveSuffix,
    setShowSuffixPrompt,
    setSuffixAccountNumber,
    showSuffixPrompt,
    suffix,
    suffixAccountNumber,
  };
}

export type ReceiptVerificationState = ReturnType<typeof useReceiptVerification>;
