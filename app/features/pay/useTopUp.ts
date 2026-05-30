"use client";

import { useState } from "react";
import { compressImage } from "../verify/verificationClient";

type Status = "failed" | "idle" | "checking" | "verified";

export function useTopUp(onCreditAdded: (settledAmount: string) => void) {
  const [proofName, setProofName] = useState("");
  const [preview, setPreview] = useState("");
  const [settledAmount, setSettledAmount] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleFile(file: File) {
    setProofName(file.name);
    setSettledAmount("");
    setError("");
    setPreview(await compressImage(file));
    setStatus("idle");
  }

  function clearProof() {
    setProofName("");
    setPreview("");
    setSettledAmount("");
    setError("");
    setStatus("idle");
  }

  function useSampleTopUp() {
    const amount = "1,000 Birr";
    setProofName("sample-telebirr-topup.jpg");
    setPreview("");
    setSettledAmount(amount);
    setError("");
    setStatus("verified");
    onCreditAdded(amount);
  }

  async function submitTopUp() {
    if (!proofName || !preview) return;
    setStatus("checking");

    try {
      const response = await fetch("/api/vision/extract-receipt", {
        body: JSON.stringify({ image: preview }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to extract top-up receipt");
      }

      const amount = payload.extracted?.amount || "0 Birr";
      setSettledAmount(amount);
      setStatus("verified");
      onCreditAdded(amount);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to verify this top-up receipt.");
      setStatus("failed");
    }
  }

  return {
    clearProof,
    error,
    handleFile,
    preview,
    proofName,
    settledAmount,
    status,
    submitTopUp,
    useSampleTopUp,
  };
}

export type TopUpState = ReturnType<typeof useTopUp>;
