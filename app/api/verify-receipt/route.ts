import { NextRequest, NextResponse } from "next/server";
import {
  compareExtractedToVerified,
  type ExtractedReceipt,
  type Provider,
  type VerificationResult,
} from "../../lib/verification";

const baseUrl = process.env.VERIFY_API_BASE_URL || "https://verifyapi.leulzenebe.pro";

export async function POST(request: NextRequest) {
  const { extracted, accountSuffix, phoneNumber, suffix } = (await request.json()) as {
    accountSuffix?: string;
    extracted?: ExtractedReceipt;
    phoneNumber?: string;
    suffix?: string;
  };

  if (!extracted) {
    return NextResponse.json({ ok: false, error: "Missing extracted receipt data" }, { status: 400 });
  }

  const apiKey = process.env.VERIFY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing VERIFY_API_KEY" }, { status: 500 });
  }

  const providerRequest = buildProviderRequest(extracted, { accountSuffix, phoneNumber, suffix });

  if (!providerRequest.ok) {
    return NextResponse.json({ ok: false, error: providerRequest.error }, { status: 400 });
  }

  const response = await fetch(`${baseUrl}${providerRequest.path}`, {
    body: JSON.stringify(providerRequest.body),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Provider verification failed" }, { status: 502 });
  }

  const providerResponse = await response.json();
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
}

function buildProviderRequest(
  extracted: ExtractedReceipt,
  extra: { accountSuffix?: string; phoneNumber?: string; suffix?: string },
) {
  if (extracted.provider === "cbe") {
    if (!extra.accountSuffix) return { ok: false as const, error: "CBE requires accountSuffix" };

    return {
      body: { accountSuffix: extra.accountSuffix, reference: extracted.transactionNumber },
      ok: true as const,
      path: "/verify-cbe",
    };
  }

  if (extracted.provider === "telebirr") {
    return {
      body: { reference: extracted.transactionNumber },
      ok: true as const,
      path: "/verify-telebirr",
    };
  }

  if (extracted.provider === "dashen") {
    return {
      body: { reference: extracted.transactionNumber },
      ok: true as const,
      path: "/verify-dashen",
    };
  }

  if (extracted.provider === "abyssinia") {
    if (!extra.suffix) return { ok: false as const, error: "Abyssinia requires suffix" };

    return {
      body: { reference: extracted.transactionNumber, suffix: extra.suffix },
      ok: true as const,
      path: "/verify-abyssinia",
    };
  }

  if (extracted.provider === "cbebirr") {
    if (!extra.phoneNumber) return { ok: false as const, error: "CBE Birr requires phoneNumber" };

    return {
      body: { phoneNumber: extra.phoneNumber, receiptNumber: extracted.transactionNumber },
      ok: true as const,
      path: "/verify-cbebirr",
    };
  }

  if (extracted.provider === "mpesa") {
    if (!extra.phoneNumber) return { ok: false as const, error: "M-Pesa requires phoneNumber" };

    return {
      body: { phoneNumber: extra.phoneNumber, receiptNumber: extracted.transactionNumber },
      ok: true as const,
      path: "/verify-mpesa",
    };
  }

  return { ok: false as const, error: "Unsupported provider" };
}

function normalizeProviderResponse(provider: Provider, response: Record<string, unknown>): ExtractedReceipt {
  if (provider === "cbe") {
    return {
      date: String(response.date || ""),
      provider,
      transactionNumber: String(response.reference || ""),
      transactionTo: String(response.receiver || ""),
    };
  }

  if (provider === "telebirr") {
    const data = response.data as Record<string, unknown>;

    return {
      date: String(data.paymentDate || ""),
      provider,
      transactionNumber: String(data.receiptNo || ""),
      transactionTo: String(data.creditedPartyName || ""),
    };
  }

  if (provider === "dashen") {
    return {
      date: "",
      provider,
      transactionNumber: String(response.transactionReference || ""),
      transactionTo: String(response.narrative || ""),
    };
  }

  if (provider === "abyssinia") {
    const data = response.data as Record<string, unknown>;

    return {
      date: String(data.date || ""),
      provider,
      transactionNumber: String(data.reference || ""),
      transactionTo: String(data.receiver || ""),
    };
  }

  if (provider === "cbebirr") {
    return {
      date: String(response.transactionDate || ""),
      provider,
      transactionNumber: String(response.receiptNumber || response.reference || ""),
      transactionTo: String(response.receiverName || response.creditAccount || ""),
    };
  }

  const data = response.data as Record<string, unknown>;

  return {
    date: String(data.transactionDate || ""),
    provider,
    transactionNumber: String(data.receiptNumber || ""),
    transactionTo: String(data.receiver || ""),
  };
}
