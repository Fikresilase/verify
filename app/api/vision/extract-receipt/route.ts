import { NextRequest, NextResponse } from "next/server";
import { extractReceiptFromImage } from "../../../lib/serverVerification";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { image } = (await request.json()) as { image?: string };

  if (!image) {
    return NextResponse.json({ ok: false, error: "Missing receipt image" }, { status: 400 });
  }

  try {
    const extracted = await extractReceiptFromImage(image);

    return NextResponse.json({ extracted, ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "OpenRouter extraction failed" },
      { status: 502 },
    );
  }
}
