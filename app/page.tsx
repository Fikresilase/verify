"use client";

import { useMemo, useState } from "react";
import { Icon } from "./components/Icon";
import { useTelegramWebApp } from "./components/useTelegramWebApp";
import {
  AppHeader,
  BottomNav,
  DesktopSidebar,
  DetailRow,
  Metric,
  PageIntro,
  PrimaryButton,
  SecureStatus,
  type Tab,
} from "./components/ui";

const members = [
  { initials: "AB", name: "Abebe B.", phone: "+251 91 234 5678", scans: 18 },
  { initials: "SK", name: "Selam K.", phone: "+251 98 765 4321", scans: 11 },
  { initials: "MT", name: "Miki T.", phone: "+251 92 112 9044", scans: 7 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("verify");
  const [showResult, setShowResult] = useState(false);
  const telegram = useTelegramWebApp();

  const intro = useMemo(() => {
    if (activeTab === "pay") {
      return { title: "Top-up Credits", description: "Add verification credits to your workspace." };
    }

    return { title: "Manage Group", description: "Control center for your verification team." };
  }, [activeTab]);

  return (
    <div className={`min-h-dvh bg-[#f8f9ff] text-[#0b1c30] ${telegram.colorScheme === "dark" ? "telegram-dark" : ""}`}>
      <AppHeader platform={telegram.platform} username={telegram.user?.username || telegram.user?.first_name} />

      <div className="mx-auto flex w-full max-w-6xl gap-6 px-5 pb-28 pt-24 md:px-8 md:pb-8 md:pt-20">
        <DesktopSidebar activeTab={activeTab} onChange={setActiveTab} />
        <main className="min-w-0 flex-1">
          {activeTab !== "verify" && <PageIntro description={intro.description} title={intro.title} />}
          {activeTab === "verify" && <VerifyScreen onVerified={() => setShowResult(true)} />}
          {activeTab === "pay" && <PayScreen />}
          {activeTab === "manage" && <ManageScreen />}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {showResult && <SuccessSheet onClose={() => setShowResult(false)} />}
    </div>
  );
}

function VerifyScreen({ onVerified }: { onVerified: () => void }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(360px,600px)_minmax(280px,1fr)] lg:items-start">
      <div className="flex min-h-[calc(100dvh-176px)] flex-col gap-5 lg:min-h-0">
        <SecureStatus text="Secure Connection Active" />
        <ScannerCard onVerified={onVerified} />
      </div>
      <div className="space-y-5 lg:pt-7">
        <LastScanCard />
        <VerificationSummary />
      </div>
    </section>
  );
}

function ScannerCard({ onVerified }: { onVerified: () => void }) {
  return (
    <button
      className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#c6c6cd] bg-[#d3e4fe] text-left shadow-[0_4px_12px_rgba(11,28,48,0.04)] active:scale-[0.99] md:aspect-square"
      onClick={onVerified}
      type="button"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.9),rgba(211,228,254,0.5)_35%,rgba(33,49,69,0.2)_100%)]" />
      <ReceiptMockup />
      <CameraPrompt />
    </button>
  );
}

function ReceiptMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-10">
      <div className="receipt-mockup h-[64%] w-[58%] rotate-[-4deg] rounded-lg bg-white p-4 shadow-2xl">
        <div className="mb-4 h-3 w-20 rounded bg-[#131b2e]" />
        <div className="space-y-2">
          <div className="h-2 rounded bg-[#dce9ff]" />
          <div className="h-2 w-4/5 rounded bg-[#dce9ff]" />
          <div className="h-2 rounded bg-[#dce9ff]" />
          <div className="my-4 h-px bg-[#c6c6cd]" />
          <div className="h-3 w-24 rounded bg-[#6cf8bb]" />
          <div className="h-2 w-3/5 rounded bg-[#dce9ff]" />
        </div>
      </div>
    </div>
  );
}

function CameraPrompt() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end px-6 pb-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white shadow-xl">
        <Icon name="camera" size={36} />
      </div>
      <h1 className="text-2xl font-bold text-black">Capture your receipt</h1>
      <p className="mt-2 max-w-xs text-sm font-medium leading-5 text-[#45464d]">
        Tap the camera button after the payment receipt is visible.
      </p>
    </div>
  );
}

function LastScanCard() {
  return (
    <div className="mt-auto flex items-center justify-between rounded-lg border border-[#c6c6cd] border-l-4 border-l-[#006c49] bg-white p-4 shadow-[0_4px_12px_rgba(11,28,48,0.04)] lg:mt-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6cf8bb] text-[#00714d]">
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
    <div className="hidden rounded-xl border border-[#c6c6cd] bg-white p-5 shadow-sm lg:block">
      <h2 className="mb-4 text-base font-bold">Today&apos;s Activity</h2>
      <div className="grid gap-3">
        <Metric icon="receipt_long" label="Total Scans" value="36" />
        <Metric icon="trending_up" label="Verified Income" value="12,500 ETB" />
      </div>
    </div>
  );
}

function PayScreen() {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(360px,1fr)] lg:items-start">
        <div className="space-y-6">
          <BalanceCard />
          <PaymentInstructions />
        </div>
        <TopUpForm />
      </div>
      <SecureStatus text="Secure encrypted connection" />
    </section>
  );
}

function BalanceCard() {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-[#45464d]">
        <Icon name="account_balance_wallet" />
        <h2 className="text-sm font-semibold">Current Balance</h2>
      </div>
      <p className="text-2xl font-bold">2,450.00 ETB</p>
    </div>
  );
}

function PaymentInstructions() {
  return (
    <div className="rounded-lg border border-[#c6c6cd] bg-[#eff4ff] p-4">
      <h2 className="mb-2 text-sm font-semibold">Payment Instructions</h2>
      <p className="mb-3 text-base leading-6 text-[#45464d]">
        Transfer the required amount using one of the methods below, then upload the receipt.
      </p>
      <PaymentMethod icon="phone_iphone" value="Telebirr: 0911XXXXXX" />
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

function TopUpForm() {
  return (
    <form className="space-y-5">
      <UploadField />
      <PrimaryButton icon="check_circle">Submit Proof of Payment</PrimaryButton>
    </form>
  );
}

function UploadField() {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">Proof of Payment</span>
      <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c6c6cd] bg-white p-8 text-center transition hover:bg-[#eff4ff]">
        <Icon className="mb-3 rounded-full bg-[#e5eeff] p-3 text-black" name="upload_file" size={48} />
        <span className="text-sm font-semibold">Tap to upload or drag and drop</span>
        <span className="mt-1 text-xs font-medium text-[#76777d]">JPG, PNG, PDF, max 5MB</span>
        <input accept="image/*,.pdf" className="hidden" type="file" />
      </div>
    </label>
  );
}

function ManageScreen() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(360px,1fr)] lg:items-start">
      <div className="space-y-6">
        <GroupOverview />
        <PrimaryButton icon="person_add">Invite New Member</PrimaryButton>
      </div>
      <TeamMembers />
    </section>
  );
}

function GroupOverview() {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#131b2e] text-white">
          <Icon name="group" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Resto-A Group</h2>
          <p className="text-xs font-medium text-[#45464d]">Active workspace</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric icon="trending_up" label="Scanned Today" value="12,500 ETB" />
        <Metric icon="receipt_long" label="Total Scans" value="36" />
      </div>
    </div>
  );
}

function TeamMembers() {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#45464d]">Team Members</h2>
      <div className="overflow-hidden rounded-xl border border-[#c6c6cd] bg-white shadow-sm">
        {members.map((member) => (
          <MemberRow key={member.phone} member={member} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: (typeof members)[number] }) {
  return (
    <div className="flex items-center justify-between border-b border-[#c6c6cd] p-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3e4fe] text-sm font-bold">
          {member.initials}
        </div>
        <div>
          <p className="text-sm font-semibold">{member.name}</p>
          <p className="text-xs font-medium text-[#45464d]">{member.phone}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="hidden text-xs font-semibold text-[#45464d] min-[390px]:inline">{member.scans} scans</span>
        <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#ba1a1a] active:scale-95" type="button">
          <Icon name="person_remove" />
        </button>
      </div>
    </div>
  );
}

function SuccessSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="success-sheet max-h-[90dvh] w-full max-w-[640px] overflow-hidden rounded-t-[28px] bg-[#f8f9ff] shadow-2xl md:rounded-[28px]">
        <SuccessHeader />
        <div className="px-5 py-6">
          <SuccessDetails />
          <div className="my-5">
            <SecureStatus text="Secure Connection Verified" />
          </div>
          <PrimaryButton onClick={onClose} rounded="full">
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function SuccessHeader() {
  return (
    <div className="relative overflow-hidden bg-[#6cf8bb] px-5 py-8 text-center text-[#00714d]">
      <div className="dot-pattern absolute inset-0 opacity-20" />
      <div className="success-pulse relative z-10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#006c49] text-white shadow-lg">
        <Icon name="check_circle" size={48} />
      </div>
      <h2 className="relative z-10 text-3xl font-bold">Verified</h2>
      <p className="relative z-10 mt-1 text-base font-medium">Transaction confirmed securely.</p>
    </div>
  );
}

function SuccessDetails() {
  return (
    <div className="rounded-lg border border-[#c6c6cd] border-l-4 border-l-[#006c49] bg-white p-4 shadow-sm">
      <DetailRow icon="payments" label="Amount" strong value="500.00 ETB" />
      <DetailRow icon="account_balance" label="Bank" value="CBE" />
      <DetailRow icon="storefront" label="Recipient" value="Resto-A" />
      <DetailRow code icon="receipt_long" label="Transaction ID" last value="TXN123456789" />
    </div>
  );
}
