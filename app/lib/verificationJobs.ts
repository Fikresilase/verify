import { compareExtractedToVerified, type VerificationResult } from "./verification";
import { callProviderVerification, extractReceiptFromImage, normalizeProviderResponse } from "./serverVerification";

export type VerificationJobStage = "checking_image" | "needs_cbe_suffix" | "verifying_transaction" | "completed" | "failed";

export type VerificationJob = {
  error?: string;
  extracted?: VerificationResult["extracted"];
  id: string;
  result?: VerificationResult;
  stage: VerificationJobStage;
};

const jobs = new Map<string, VerificationJob>();

export function createVerificationJob(image: string, overrides: { accountSuffix?: string; receiptUrl?: string } = {}) {
  const id = crypto.randomUUID();

  jobs.set(id, {
    id,
    stage: "checking_image",
  });

  processVerificationJob(id, image, overrides);

  return id;
}

export function getVerificationJob(id: string) {
  return jobs.get(id);
}

async function processVerificationJob(id: string, image: string, overrides: { accountSuffix?: string; receiptUrl?: string }) {
  const job = jobs.get(id);

  if (!job) {
    return;
  }

  try {
    const extracted = await extractReceiptFromImage(image);
    if (overrides.accountSuffix) {
      extracted.accountSuffix = overrides.accountSuffix;
    }
    if (overrides.receiptUrl) {
      extracted.receiptUrl = overrides.receiptUrl;
      if (extracted.provider === "cbe") {
        extracted.transactionNumber = overrides.receiptUrl;
      }
    }

    if (extracted.provider === "cbe" && !extracted.receiptUrl && !overrides.accountSuffix) {
      jobs.set(id, {
        extracted,
        id,
        stage: "needs_cbe_suffix",
      });
      return;
    }
    jobs.set(id, { ...job, stage: "verifying_transaction" });

    try {
      const providerResponse = await callProviderVerification(extracted, {
        accountSuffix: extracted.accountSuffix,
        suffix: extracted.accountSuffix,
      });
      const normalized = normalizeProviderResponse(extracted.provider, providerResponse);
      const comparison = compareExtractedToVerified(extracted, normalized);
      console.log("[verify.compare] normalized_provider_response", normalized);
      console.log("[verify.compare] checks", JSON.stringify(comparison.checks, null, 2));
      console.log("[verify.compare] is_success", comparison.isSuccess);

      jobs.set(id, {
        id,
        result: {
          checks: comparison.checks,
          extracted,
          isSuccess: comparison.isSuccess,
          normalized,
          providerResponse,
        },
        stage: "completed",
      });
    } catch (providerError) {
      const errorMessage = providerError instanceof Error ? providerError.message : "Provider verification failed";

      jobs.set(id, {
        id,
        result: {
          checks: [
            {
              key: "provider",
              label: "Provider",
              matched: true,
              receiptValue: extracted.provider,
              verifiedValue: extracted.provider,
            },
            {
              key: "time",
              label: "Time",
              matched: false,
              receiptValue: extracted.time,
              verifiedValue: errorMessage,
            },
            {
              key: "transactionTo",
              label: "Transaction To",
              matched: false,
              receiptValue: extracted.transactionTo,
              verifiedValue: errorMessage,
            },
            {
              key: "transactionNumber",
              label: "Transaction Number",
              matched: false,
              receiptValue: extracted.transactionNumber,
              verifiedValue: errorMessage,
            },
          ],
          extracted,
          isSuccess: false,
          normalized: {
            accountSuffix: extracted.accountSuffix,
            provider: extracted.provider,
            receiptUrl: extracted.receiptUrl,
            time: "",
            transactionNumber: "",
            transactionTo: "",
          },
          providerResponse: { error: errorMessage },
        },
        stage: "completed",
      });
    }
  } catch (error) {
    jobs.set(id, {
      error: error instanceof Error ? error.message : "Verification failed",
      id,
      stage: "failed",
    });
  }
}
