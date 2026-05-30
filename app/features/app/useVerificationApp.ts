"use client";

import { useMemo, useState } from "react";
import type { Tab } from "@/app/components/ui";
import type { VerificationResult } from "@/app/lib/verification";
import { initialGroups } from "../groups/groupData";
import type { Group } from "../groups/types";
import { parseSettledAmount } from "../common/money";

export function useVerificationApp() {
  const [activeTab, setActiveTab] = useState<Tab>("verify");
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroups[0].id);
  const [showResult, setShowResult] = useState(false);
  const [topUpResult, setTopUpResult] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const intro = useMemo(() => {
    if (activeTab === "pay") {
      return { title: "Top-up Credits", description: "Add verification credits to your workspace." };
    }

    return { title: "Manage Group", description: "Control center for your verification team." };
  }, [activeTab]);

  function handleVerified(result: VerificationResult) {
    setVerificationResult(result);
    setShowResult(true);
  }

  function handleCreditAdded(settledAmount: string) {
    const amount = parseSettledAmount(settledAmount);
    setGroups((current) =>
      current.map((group) => (group.id === selectedGroup.id ? { ...group, balance: group.balance + amount } : group)),
    );
    setTopUpResult(settledAmount);
  }

  return {
    activeTab,
    groups,
    handleCreditAdded,
    handleVerified,
    intro,
    selectedGroup,
    setActiveTab,
    setGroups,
    setSelectedGroupId,
    setShowResult,
    showResult,
    setTopUpResult,
    topUpResult,
    verificationResult,
  };
}

export type VerificationAppState = ReturnType<typeof useVerificationApp>;
