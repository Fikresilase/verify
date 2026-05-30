"use client";

import { Icon } from "@/app/components/Icon";
import type { Group } from "../groups/types";

export function BalanceCard({ group }: { group: Group }) {
  return (
    <div className="rounded-lg border border-[#172235] bg-[#111827] p-6 text-[#fbfdfb] shadow-[0_20px_60px_rgba(13,23,36,0.18)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#b8d7ff]">
          <Icon name="account_balance_wallet" />
          <h2 className="text-sm font-semibold">{group.name}</h2>
        </div>
        <span className="rounded-full bg-[#d9fbe9] px-2 py-1 text-[11px] font-bold text-[#006c49]">Active</span>
      </div>
      <p className="text-3xl font-black">{group.balance.toLocaleString()} ETB</p>
      <p className="mt-2 text-sm font-semibold text-[#b8c7d9]">Estimated {Math.max(0, Math.floor(group.balance / 25)).toLocaleString()} verifications remaining</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-semibold text-[#b8c7d9]">
        <div className="rounded bg-[#fbfdfb]/[0.06] p-3">{group.todayScans} scans today</div>
        <div className="rounded bg-[#fbfdfb]/[0.06] p-3">{group.successRate}% success rate</div>
      </div>
    </div>
  );
}

export function PaymentInstructions() {
  return (
    <div className="surface-line rounded-lg border bg-[#fbfdfb]/90 p-4 backdrop-blur">
      <h2 className="mb-2 text-sm font-semibold">Payment Instructions</h2>
      <p className="mb-3 text-base leading-6 text-[#45464d]">
        Transfer the required amount using one of the methods below, then upload the receipt.
      </p>
      <PaymentMethod icon="phone_iphone" value="Telebirr: 0911XXXXXX" />
      <PaymentMethod icon="account_balance" value="CBE: 1000 0123 4567" />
    </div>
  );
}

function PaymentMethod({ icon, value }: { icon: "account_balance" | "phone_iphone"; value: string }) {
  return (
    <p className="flex items-center gap-2 text-base font-medium">
      <Icon className="text-[#76777d]" name={icon} size={20} />
      {value}
    </p>
  );
}
