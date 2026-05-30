import type { VerificationResult } from "@/app/lib/verification";
import type { ExtractReceiptResponse, LoadingStage, VerifyReceiptResponse } from "./types";

export async function runReceiptVerification({
  accountSuffix,
  extracted,
  image,
  onStage,
}: {
  accountSuffix: string;
  extracted: VerificationResult["extracted"] | null;
  image: string;
  onStage: (stage: LoadingStage) => void;
}) {
  let receipt = extracted;

  if (!receipt) {
    onStage("checking_image");
    const response = await fetch("/api/vision/extract-receipt", {
      body: JSON.stringify({ image }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as ExtractReceiptResponse;

    if (!response.ok || !payload.ok) {
      throw new Error(getApiError(payload, "Unable to read receipt"));
    }

    receipt = payload.extracted;
  }

  onStage("verifying_transaction");
  const verifyResponse = await fetch("/api/verify-receipt", {
    body: JSON.stringify({ accountSuffix, extracted: receipt }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const verifyPayload = (await verifyResponse.json()) as VerifyReceiptResponse;

  if (!verifyResponse.ok || !verifyPayload.ok) {
    throw new Error(getApiError(verifyPayload, "Unable to verify receipt"));
  }

  return { extracted: receipt, payload: verifyPayload };
}

export function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Unable to process image"));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Unable to load image"));
    };

    image.src = source;
  });
}

export function buildFailedResult(
  extracted: VerificationResult["extracted"] | null,
  reason: string,
): VerificationResult {
  const fallback = extracted || {
    accountSuffix: "",
    amount: "",
    time: "",
    provider: "telebirr" as const,
    receiptUrl: "",
    transactionNumber: "",
    transactionTo: "",
  };

  return {
    checks: [
      { key: "provider", label: "Provider", matched: Boolean(extracted), receiptValue: fallback.provider, verifiedValue: extracted ? fallback.provider : reason },
      { key: "amount", label: "Amount", matched: false, receiptValue: fallback.amount || "", verifiedValue: reason },
      { key: "time", label: "Time", matched: false, receiptValue: fallback.time, verifiedValue: reason },
      { key: "transactionTo", label: "Transaction To", matched: false, receiptValue: fallback.transactionTo, verifiedValue: reason },
      { key: "transactionNumber", label: "Transaction Number", matched: false, receiptValue: fallback.transactionNumber, verifiedValue: reason },
    ],
    extracted: fallback,
    isSuccess: false,
    normalized: fallback,
    providerResponse: { error: reason },
  };
}

function getApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const { error } = payload as { error?: unknown };
    return typeof error === "string" && error ? friendlyError(error) : fallback;
  }

  return fallback;
}

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("openrouter_api_key")) return "Receipt AI is not configured on this deployment.";
  if (lower.includes("timeout") || lower.includes("aborted")) return "The provider took too long to respond.";
  if (lower.includes("missing receipt image")) return "Receipt image was not received.";
  if (lower.includes("failed to fetch") || lower.includes("network")) return "The verification provider is unreachable.";
  return message;
}
