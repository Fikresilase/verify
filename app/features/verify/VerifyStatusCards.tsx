"use client";

import { Icon } from "@/app/components/Icon";
import { Metric } from "@/app/components/ui";

export function VerifyStatusCards() {
  return (
    <div className="space-y-5 lg:pt-7">
      <LastScanCard />
      <VerificationSummary />
    </div>
  );
}

function LastScanCard() {
  return (
    <div className="surface-line mt-auto flex items-center justify-between rounded-lg border bg-[#fbfdfb]/92 p-4 backdrop-blur lg:mt-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9fbe9] text-[#00714d]">
          <Icon name="check_circle" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Last Scan</h2>
          <p className="text-xs font-medium text-[#45464d]">500 ETB Verified</p>
        </div>
      </div>
      <span className="text-xs font-medium text-[#45464d]">Just now</span>
    </div>
  );
}

function VerificationSummary() {
  return (
    <div className="surface-line hidden rounded-lg border bg-[#fbfdfb]/92 p-5 backdrop-blur lg:block">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">Today&apos;s Activity</h2>
        <span className="rounded-full bg-[#fff4d6] px-2 py-1 text-[11px] font-bold text-[#775500]">Live</span>
      </div>
      <div className="grid gap-3">
        <Metric icon="receipt_long" label="Total Scans" value="36" />
        <Metric icon="trending_up" label="Verified Income" value="12,500 ETB" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#45464d]">
        <div className="rounded bg-[#f3f7f5] p-2">Telebirr</div>
        <div className="rounded bg-[#f3f7f5] p-2">CBE</div>
        <div className="rounded bg-[#f3f7f5] p-2">M-Pesa</div>
      </div>
    </div>
  );
}
