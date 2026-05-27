import { NextRequest, NextResponse } from "next/server";
import { callProviderVerification, normalizeProviderResponse } from "../../lib/serverVerification";
import { compareExtractedToVerified, type ExtractedReceipt, type VerificationResult } from "../../lib/verification";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { accountSuffix, extracted, phoneNumber, suffix } = (await request.json()) as {
    accountSuffix?: string;
    extracted?: ExtractedReceipt;
    phoneNumber?: string;
    suffix?: string;
  };

  if (!extracted) {
    return NextResponse.json({ ok: false, error: "Missing extracted receipt data" }, { status: 400 });
  }

  try {
    const providerResponse = await callProviderVerification(extracted, {
      accountSuffix: accountSuffix || extracted.accountSuffix,
      phoneNumber,
      suffix: suffix || extracted.accountSuffix,
    });
    const normalized = normalizeProviderResponse(extracted.provider, providerResponse);
    const comparison = compareExtractedToVerified(extracted, normalized);

    const result: VerificationResult = {
      checks: comparison.checks,
      extracted,
      isSuccess: comparison.isSuccess,
      normalized,
      providerResponse,
    };

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Provider verification failed" },
      { status: 502 },
    );
  }
}
