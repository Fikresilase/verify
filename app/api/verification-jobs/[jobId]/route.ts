import { NextRequest, NextResponse } from "next/server";
import { getVerificationJob } from "../../../lib/verificationJobs";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getVerificationJob(jobId);

  if (!job) {
    return NextResponse.json({ ok: false, error: "Verification job not found" }, { status: 404 });
  }

  return NextResponse.json({ job, ok: true });
}
