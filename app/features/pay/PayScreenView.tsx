"use client";

import type { Group } from "../groups/types";
import { BalanceCard, PaymentInstructions } from "./PayCards";
import { TopUpForm } from "./TopUpForm";
import type { TopUpState } from "./useTopUp";

export function PayScreenView({ group, topUp }: { group: Group; topUp: TopUpState }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(360px,1fr)] lg:items-start">
        <div className="space-y-6">
          <BalanceCard group={group} />
          <PaymentInstructions />
        </div>
        <TopUpForm topUp={topUp} />
      </div>
    </section>
  );
}
