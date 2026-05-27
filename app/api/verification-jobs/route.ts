import { NextRequest, NextResponse } from "next/server";
import { createVerificationJob } from "../../lib/verificationJobs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { accountSuffix, image, receiptUrl } = (await request.json()) as {
    accountSuffix?: string;
    image?: string;
    receiptUrl?: string;
  };

  if (!image) {
    return NextResponse.json({ ok: false, error: "Missing receipt image" }, { status: 400 });
  }

  const jobId = createVerificationJob(image, { accountSuffix, receiptUrl });

  return NextResponse.json({ jobId, ok: true });
}
