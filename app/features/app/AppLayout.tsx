"use client";

import { AppHeader, BottomNav, DesktopSidebar, PageIntro } from "@/app/components/ui";
import { ManageScreen } from "../manage/ManageScreen";
import { PayScreen } from "../pay/PayScreen";
import { ResultSheets } from "../results/ResultSheets";
import { VerifyScreen } from "../verify/VerifyScreen";
import type { VerificationAppState } from "./useVerificationApp";

export function AppLayout({
  colorScheme,
  platform,
  state,
  username,
}: {
  colorScheme?: string;
  platform?: string;
  state: VerificationAppState;
  username?: string;
}) {
  const isVerifyTab = state.activeTab === "verify";
  const shellClass = isVerifyTab ? "h-dvh overflow-hidden" : "min-h-dvh";
  const contentClass = isVerifyTab
    ? "mx-auto flex h-dvh w-full max-w-6xl gap-6 px-4 pb-[84px] pt-[72px] sm:px-5 md:px-8 md:pb-8 md:pt-20"
    : "mx-auto flex w-full max-w-6xl gap-6 px-4 pb-28 pt-24 sm:px-5 md:px-8 md:pb-8 md:pt-20";

  return (
    <div className={`app-shell ${shellClass} text-[#0b1c30] ${colorScheme === "dark" ? "telegram-dark" : ""}`}>
      <AppHeader platform={platform} username={username} />
      <div className={contentClass}>
        <DesktopSidebar activeTab={state.activeTab} onChange={state.setActiveTab} />
        <main className="min-w-0 flex-1">
          {state.activeTab !== "verify" && <PageIntro description={state.intro.description} title={state.intro.title} />}
          {state.activeTab === "verify" && <VerifyScreen onVerified={state.handleVerified} />}
          {state.activeTab === "pay" && <PayScreen group={state.selectedGroup} onCreditAdded={state.handleCreditAdded} />}
          {state.activeTab === "manage" && (
            <ManageScreen
              groups={state.groups}
              onChangeGroups={state.setGroups}
              onSelectGroup={state.setSelectedGroupId}
              selectedGroup={state.selectedGroup}
            />
          )}
        </main>
      </div>
      <BottomNav activeTab={state.activeTab} onChange={state.setActiveTab} />
      <ResultSheets
        onCloseResult={() => state.setShowResult(false)}
        onCloseTopUp={() => state.setTopUpResult(null)}
        showResult={state.showResult}
        topUpResult={state.topUpResult}
        verificationResult={state.verificationResult}
      />
    </div>
  );
}
