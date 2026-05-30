import { NextRequest, NextResponse } from "next/server";
import { apiError } from "../../../lib/apiErrors";
import { extractReceiptFromImage } from "../../../lib/serverVerification";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { image } = (await request.json()) as { image?: string };

  if (!image) {
    return NextResponse.json({ ok: false, error: "Missing receipt image" }, { status: 400 });
  }

  try {
    const extracted = await extractReceiptFromImage(image);

    return NextResponse.json({ extracted, ok: true });
  } catch (error) {
    const failure = apiError(error, "Receipt extraction failed");
    return NextResponse.json({ ok: false, error: failure.message }, { status: failure.status });
  }
}
