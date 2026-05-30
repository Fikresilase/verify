"use client";

import { PrimaryButton } from "@/app/components/ui";
import { UploadField } from "./UploadField";
import type { TopUpState } from "./useTopUp";

export function TopUpForm({ topUp }: { topUp: TopUpState }) {
  return (
    <div className="surface-line rounded-lg border bg-[#fbfdfb]/92 p-4 backdrop-blur md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Top-up Receipt</h2>
        <span className="rounded-full bg-[#f3f7f5] px-2 py-1 text-[11px] font-bold text-[#45464d]">Telebirr</span>
      </div>
      <UploadField
        fileName={topUp.proofName}
        onChange={topUp.handleFile}
        onClear={topUp.clearProof}
        preview={topUp.preview}
      />
      <PrimaryButton icon="check_circle" onClick={topUp.submitTopUp}>
        {topUp.status === "checking" ? "Verifying Telebirr payment..." : "Verify and Add Credits"}
      </PrimaryButton>
      <button className="mt-3 w-full rounded-lg border border-[#bfead1] bg-[#effff8] px-4 py-3 text-sm font-bold text-[#006c49]" onClick={topUp.useSampleTopUp} type="button">
        Use sample top-up
      </button>
      {(topUp.proofName || topUp.status === "failed") && (
        <TopUpStatus error={topUp.error} settledAmount={topUp.settledAmount} status={topUp.status} />
      )}
    </div>
  );
}

function TopUpStatus({ error, settledAmount, status }: { error: string; settledAmount: string; status: TopUpState["status"] }) {
  return (
    <div className={`mt-5 rounded-lg border p-3 text-sm font-medium ${status === "failed" ? "border-[#ffb4ab] bg-[#fff4f2] text-[#93000a]" : "border-[#d8e4f1] bg-[#fbfdfb] text-[#45464d]"}`}>
      {status === "failed"
        ? error || "Unable to verify this top-up receipt."
        : status === "verified"
        ? `Payment verified. Settled amount: ${settledAmount}`
        : settledAmount
          ? `Settled amount: ${settledAmount}`
          : "Receipt ready for verification."}
    </div>
  );
}
