import { NextRequest, NextResponse } from "next/server";
import { apiError } from "../../lib/apiErrors";
import { extractReceiptFromImage, verifyExtractedReceipt } from "../../lib/serverVerification";
import type { ExtractedReceipt } from "../../lib/verification";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { accountSuffix, extracted, image, phoneNumber, receiptUrl, suffix } = (await request.json()) as {
    accountSuffix?: string;
    extracted?: ExtractedReceipt;
    image?: string;
    phoneNumber?: string;
    receiptUrl?: string;
    suffix?: string;
  };

  if (!image && !extracted) {
    return NextResponse.json({ ok: false, error: "Missing receipt image or extracted receipt data" }, { status: 400 });
  }

  try {
    const receipt = extracted || (await extractReceiptFromImage(image as string));
    const outcome = await verifyExtractedReceipt(receipt, {
      accountSuffix,
      phoneNumber,
      receiptUrl,
      suffix: suffix || accountSuffix || receipt.accountSuffix,
    });

    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    const failure = apiError(error, "Receipt verification failed");
    return NextResponse.json({ ok: false, error: failure.message }, { status: failure.status });
  }
}
