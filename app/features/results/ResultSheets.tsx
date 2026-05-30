"use client";

import { Icon } from "@/app/components/Icon";
import { PrimaryButton } from "@/app/components/ui";
import type { VerificationCheck, VerificationResult } from "@/app/lib/verification";
import { demoVerificationResult } from "../verify/demoReceipt";
import { getResultPresentation, type ResultPresentation } from "./resultPresentation";

export function ResultSheets({
  onCloseResult,
  onCloseTopUp,
  showResult,
  topUpResult,
  verificationResult,
}: {
  onCloseResult: () => void;
  onCloseTopUp: () => void;
  showResult: boolean;
  topUpResult: string | null;
  verificationResult: VerificationResult | null;
}) {
  return (
    <>
      {showResult && <SuccessSheet onClose={onCloseResult} result={verificationResult} />}
      {topUpResult !== null && <TopUpSuccessSheet amount={topUpResult} onClose={onCloseTopUp} />}
    </>
  );
}

function SuccessSheet({ onClose, result }: { onClose: () => void; result: VerificationResult | null }) {
  const source = result || demoVerificationResult;
  const presentation = getResultPresentation(source);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="success-sheet relative flex max-h-[calc(100dvh-12px)] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[24px] bg-[#fbfdfb] shadow-2xl md:max-h-[92dvh] md:rounded-[24px]">
        <CloseButton onClose={onClose} />
        <SuccessHeader presentation={presentation} />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pt-5">
          <ResultFacts facts={presentation.facts} />
          <SuccessDetails checks={source.checks} />
        </div>
        <div className="safe-modal-footer shrink-0 bg-[#fbfdfb] px-5 pt-4 shadow-[0_-18px_36px_-30px_rgba(17,24,39,0.5)]">
          <PrimaryButton onClick={onClose} rounded="full">
            {presentation.actionLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function TopUpSuccessSheet({ amount, onClose }: { amount: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="success-sheet relative flex max-h-[calc(100dvh-12px)] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] bg-[#fbfdfb] shadow-2xl md:rounded-[24px]">
        <CloseButton onClose={onClose} />
        <div className="relative overflow-hidden bg-[#6cf8bb] px-5 py-8 text-center text-[#00714d]">
          <div className="dot-pattern absolute inset-0 opacity-20" />
          <div className="relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#006c49] text-[#fbfdfb] shadow-lg">
            <Icon name="check_circle" size={36} />
          </div>
          <h2 className="relative z-10 text-2xl font-bold">Credits Added</h2>
          <p className="relative z-10 mt-2 text-base font-semibold">You added {amount} ETB to your account.</p>
        </div>
        <div className="safe-modal-footer shrink-0 px-5 pt-6">
          <PrimaryButton onClick={onClose} rounded="full">Done</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      aria-label="Close result"
      className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#fbfdfb]/90 text-2xl font-black leading-none text-[#111827] shadow-[0_14px_30px_-18px_rgba(17,24,39,0.8)]"
      onClick={onClose}
      type="button"
    >
      x
    </button>
  );
}

function SuccessHeader({ presentation }: { presentation: ResultPresentation }) {
  const styles = {
    danger: "bg-[#ffdad6] text-[#93000a]",
    success: "bg-[#6cf8bb] text-[#006c49]",
    warning: "bg-[#fff4d6] text-[#775500]",
  };
  const iconStyles = {
    danger: "bg-[#ba1a1a]",
    success: "bg-[#006c49]",
    warning: "bg-[#775500]",
  };

  return (
    <div className={`relative shrink-0 overflow-hidden px-5 py-6 text-center md:py-8 ${styles[presentation.tone]}`}>
      <div className="dot-pattern absolute inset-0 opacity-20" />
      <div className={`success-pulse relative z-10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-[#fbfdfb] shadow-lg md:mb-4 md:h-20 md:w-20 ${iconStyles[presentation.tone]}`}>
        {presentation.tone === "success" ? <Icon name="check_circle" size={40} /> : <span className="text-4xl font-black leading-none">!</span>}
      </div>
      <div className="relative z-10 mx-auto mb-3 w-fit rounded-full bg-[#fbfdfb]/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em]">
        {presentation.badge}
      </div>
      <h2 className="relative z-10 text-2xl font-black md:text-3xl">{presentation.title}</h2>
      <p className="relative z-10 mx-auto mt-2 max-w-sm text-sm font-semibold leading-5 md:text-base md:leading-6">{presentation.summary}</p>
    </div>
  );
}

function ResultFacts({ facts }: { facts: ResultPresentation["facts"] }) {
  return (
    <div className="grid gap-2 min-[420px]:grid-cols-3">
      {facts.map((fact) => (
        <div className="rounded-lg bg-[#f3f7f5] p-3" key={fact.label}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{fact.label}</p>
          <p className="mt-1 truncate text-sm font-black text-[#111827]">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}

function SuccessDetails({ checks }: { checks: VerificationCheck[] }) {
  return (
    <div className="rounded-lg border border-[#d8e4f1] bg-[#fbfdfb] p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-black">Verification Checks</h3>
      {checks.map((check, index) => <CheckRow check={check} key={check.key} last={index === checks.length - 1} />)}
    </div>
  );
}

function CheckRow({ check, last }: { check: VerificationCheck; last: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${last ? "" : "border-b border-[#e5eeff]"}`}>
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-[#fbfdfb] ${check.matched ? "bg-[#006c49]" : "bg-[#ba1a1a]"}`}>
        {check.matched ? <Icon name="check_circle" size={15} /> : "x"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{check.label}</p>
        <p className="truncate text-xs font-medium text-[#45464d]">Receipt: {check.receiptValue || "Missing"}</p>
        <p className="truncate text-xs font-medium text-[#45464d]">Verified: {check.verifiedValue || "Missing"}</p>
      </div>
    </div>
  );
}
