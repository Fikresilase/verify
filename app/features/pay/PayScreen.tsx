"use client";

import type { Group } from "../groups/types";
import { PayScreenView } from "./PayScreenView";
import { useTopUp } from "./useTopUp";

export function PayScreen({ group, onCreditAdded }: { group: Group; onCreditAdded: (settledAmount: string) => void }) {
  const topUp = useTopUp(onCreditAdded);
  return <PayScreenView group={group} topUp={topUp} />;
}
