import { providerLabels, type VerificationResult } from "@/app/lib/verification";
import { demoVerificationResult } from "../verify/demoReceipt";

export type ResultPresentation = {
  actionLabel: string;
  badge: string;
  facts: Array<{ label: string; value: string }>;
  summary: string;
  title: string;
  tone: "danger" | "success" | "warning";
};

export function getResultPresentation(result: VerificationResult | null): ResultPresentation {
  const source = result || demoVerificationResult;
  const failedChecks = source.checks.filter((check) => !check.matched);
  const providerError = getProviderError(source.providerResponse);

  const base = {
    actionLabel: source.isSuccess ? "Done" : "Review Receipt",
    facts: [
      { label: "Provider", value: providerLabels[source.extracted.provider] },
      { label: "Amount", value: source.extracted.amount || source.normalized.amount || "Missing" },
      { label: "Reference", value: source.extracted.transactionNumber || "Missing" },
    ],
  };

  if (source.isSuccess || failedChecks.length === 0) {
    return {
      ...base,
      badge: "Provider Match",
      summary: "The receipt fields matched the provider record.",
      title: "Receipt Verified",
      tone: "success",
    };
  }

  if (providerError) {
    return {
      ...base,
      badge: "Provider Unreachable",
      summary: providerError,
      title: "Provider Needs Retry",
      tone: "warning",
    };
  }

  if (failedChecks.some((check) => check.key === "amount")) {
    return {
      ...base,
      badge: "Amount Mismatch",
      summary: "The receipt amount does not match the provider record.",
      title: "Amount Needs Review",
      tone: "danger",
    };
  }

  if (failedChecks.some((check) => check.key === "transactionNumber")) {
    return {
      ...base,
      badge: "Reference Mismatch",
      summary: "The receipt reference was found, but it does not match the provider record.",
      title: "Reference Needs Review",
      tone: "danger",
    };
  }

  return {
    ...base,
    badge: "Field Mismatch",
    summary: "One or more receipt fields did not match the provider record.",
    title: "Receipt Needs Review",
    tone: "danger",
  };
}

function getProviderError(response: unknown) {
  if (!response || typeof response !== "object" || !("error" in response)) return "";
  const error = (response as { error?: unknown }).error;
  if (typeof error !== "string" || !error) return "";

  const lower = error.toLowerCase();
  if (lower.includes("timeout") || lower.includes("aborted")) return "The provider took too long to respond. Try again in a moment.";
  if (lower.includes("unreachable") || lower.includes("failed to fetch")) return "The provider is temporarily unreachable.";
  if (lower.includes("missing")) return error;
  return error;
}
