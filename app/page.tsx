"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "./components/Icon";
import { useTelegramWebApp } from "./components/useTelegramWebApp";
import type { VerificationCheck, VerificationResult } from "./lib/verification";
import {
  AppHeader,
  BottomNav,
  DesktopSidebar,
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

type Member = {
  initials: string;
  name: string;
  phone: string;
  scans: number;
};

type Group = {
  balance: number;
  id: number;
  isOwner: boolean;
  members: Member[];
  name: string;
};

const initialGroups: Group[] = [
  { balance: 2450, id: 1, isOwner: true, members, name: "Resto-A Group" },
  {
    balance: 0,
    id: 2,
    isOwner: false,
    members: [{ initials: "EL", name: "Ethio Lounge", phone: "+251 90 000 1122", scans: 4 }],
    name: "Ethio Lounge Team",
  },
];

const demoChecks: VerificationCheck[] = [
  {
    key: "provider",
    label: "Provider",
    matched: true,
    receiptValue: "telebirr",
    verifiedValue: "telebirr",
  },
  {
    key: "time",
    label: "Time",
    matched: true,
    receiptValue: "05-06-2025 18:56:47",
    verifiedValue: "05-06-2025 18:56:47",
  },
  {
    key: "transactionTo",
    label: "Transaction To",
    matched: true,
    receiptValue: "Resto-A",
    verifiedValue: "Resto-A",
  },
  {
    key: "transactionNumber",
    label: "Transaction Number",
    matched: true,
    receiptValue: "CE626EJRNS",
    verifiedValue: "CE626EJRNS",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("verify");
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroups[0].id);
  const [showResult, setShowResult] = useState(false);
  const [topUpResult, setTopUpResult] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const telegram = useTelegramWebApp();
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];

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
          {activeTab === "verify" && (
            <VerifyScreen
              onVerified={(result) => {
                setVerificationResult(result);
                setShowResult(true);
              }}
            />
          )}
          {activeTab === "pay" && (
            <PayScreen
              group={selectedGroup}
              onCreditAdded={(settledAmount) => {
                const amount = parseSettledAmount(settledAmount);
                setGroups((current) =>
                  current.map((group) =>
                    group.id === selectedGroup.id ? { ...group, balance: group.balance + amount } : group,
                  ),
                );
                setTopUpResult(settledAmount);
              }}
            />
          )}
          {activeTab === "manage" && (
            <ManageScreen
              groups={groups}
              onChangeGroups={setGroups}
              onSelectGroup={setSelectedGroupId}
              selectedGroup={selectedGroup}
            />
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      {showResult && <SuccessSheet onClose={() => setShowResult(false)} result={verificationResult} />}
      {topUpResult !== null && <TopUpSuccessSheet amount={topUpResult} onClose={() => setTopUpResult(null)} />}
    </div>
  );
}

type LoadingStage = "idle" | "checking_image" | "verifying_transaction";
type PollResult = { result: VerificationResult; type: "completed" } | { extracted: VerificationResult["extracted"]; type: "needs_cbe_suffix" };

function VerifyScreen({ onVerified }: { onVerified: (result: VerificationResult) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [previewImage, setPreviewImage] = useState("");
  const [accountSuffix, setAccountSuffix] = useState("");
  const [showSuffixPrompt, setShowSuffixPrompt] = useState(false);

  async function handleCapture(file: File) {
    const image = await compressImage(file);
    setPreviewImage(image);
  }

  async function handleVerify() {
    if (!previewImage) {
      return;
    }

    setIsProcessing(true);
    setLoadingStage("checking_image");

    try {
      const startResponse = await fetch("/api/verification-jobs", {
        body: JSON.stringify({ accountSuffix, image: previewImage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const startPayload = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(startPayload.error || "Unable to start verification");
      }

      const pollResult = await pollVerificationJob(startPayload.jobId, setLoadingStage);
      if (pollResult.type === "needs_cbe_suffix") {
        setShowSuffixPrompt(true);
        return;
      }
      onVerified(pollResult.result);
    } catch (error) {
      onVerified(buildFailedResult(null, error instanceof Error ? error.message : "Unable to read receipt"));
    } finally {
      setIsProcessing(false);
      setLoadingStage("idle");
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(360px,600px)_minmax(280px,1fr)] lg:items-start">
      <div className="flex min-h-[calc(100dvh-176px)] flex-col gap-5 lg:min-h-0">
        <SecureStatus text="Secure Connection Active" />
        <ScannerCard
          isProcessing={isProcessing}
          loadingStage={loadingStage}
          onCapture={handleCapture}
          onClear={() => {
            setPreviewImage("");
            setAccountSuffix("");
          }}
          accountSuffix={accountSuffix}
          onVerify={handleVerify}
          previewImage={previewImage}
        />
        {showSuffixPrompt && (
          <CbeSuffixModal
            onClose={() => setShowSuffixPrompt(false)}
            onSave={(value) => {
              setAccountSuffix(value);
              setShowSuffixPrompt(false);
              window.setTimeout(handleVerify, 0);
            }}
          />
        )}
      </div>
      <div className="space-y-5 lg:pt-7">
        <LastScanCard />
        <VerificationSummary />
      </div>
    </section>
  );
}

function ScannerCard({
  accountSuffix,
  isProcessing,
  loadingStage,
  onCapture,
  onClear,
  onVerify,
  previewImage,
}: {
  accountSuffix: string;
  isProcessing: boolean;
  loadingStage: LoadingStage;
  onCapture: (file: File) => void;
  onClear: () => void;
  onVerify: () => void;
  previewImage: string;
}) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#c6c6cd] bg-[#d3e4fe] text-left shadow-[0_4px_12px_rgba(11,28,48,0.04)] md:aspect-square">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.9),rgba(211,228,254,0.5)_35%,rgba(33,49,69,0.2)_100%)]" />
      {previewImage ? <ReceiptPreview image={previewImage} /> : <ReceiptMockup />}
      {previewImage && !isProcessing && <ClearPreviewButton onClear={onClear} />}
      <CameraPrompt
        accountSuffix={accountSuffix}
        isProcessing={isProcessing}
        loadingStage={loadingStage}
        onVerify={onVerify}
        previewImage={previewImage}
      />
      <input
        id="receipt-camera-input"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isProcessing}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onCapture(file);
          event.target.value = "";
        }}
        type="file"
      />
    </div>
  );
}

function ClearPreviewButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      aria-label="Upload another receipt"
      className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#ba1a1a] shadow-lg backdrop-blur active:scale-95"
      onClick={onClear}
      type="button"
    >
      <span className="text-2xl font-black leading-none">×</span>
    </button>
  );
}

function ReceiptPreview({ image }: { image: string }) {
  return <Image alt="Captured receipt" className="object-cover" fill sizes="(max-width: 768px) 100vw, 600px" src={image} unoptimized />;
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

function CameraPrompt({
  accountSuffix,
  isProcessing,
  loadingStage,
  onVerify,
  previewImage,
}: {
  accountSuffix: string;
  isProcessing: boolean;
  loadingStage: LoadingStage;
  onVerify: () => void;
  previewImage: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-gradient-to-t from-white/95 via-white/20 to-transparent px-6 pb-8 text-center">
      <label
        className="mb-4 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-xl active:scale-95"
        htmlFor="receipt-camera-input"
      >
        <Icon name="camera" size={36} />
      </label>
      <h1 className="text-2xl font-bold text-black">{getVerifyTitle({ isProcessing, loadingStage, previewImage })}</h1>
      <p className="mt-2 max-w-xs text-sm font-medium leading-5 text-[#45464d]">
        {previewImage
          ? "Review the captured receipt, then verify the transaction."
          : "Tap the camera button after the payment receipt is visible."}
      </p>
      {previewImage && !isProcessing && (
        <div className="mt-5 w-full max-w-xs space-y-3">
          {accountSuffix && (
            <div className="rounded-lg border border-[#c6c6cd] bg-white px-3 py-2 text-xs font-semibold text-[#45464d]">
              CBE suffix: {accountSuffix}
            </div>
          )}
          <button className="h-12 w-full rounded-lg bg-black text-base font-bold text-white active:scale-[0.98]" onClick={onVerify} type="button">
            አረጋግጥ
          </button>
        </div>
      )}
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

function CbeSuffixModal({ onClose, onSave }: { onClose: () => void; onSave: (value: string) => void }) {
  const [accountNumber, setAccountNumber] = useState("");
  const suffix = accountNumber.replace(/\D/g, "").slice(-8);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-white p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">ተቀባይ account ቁጥር</h2>
        <p className="mt-2 text-sm font-medium leading-5 text-[#45464d]">
          Enter the receiver account number. We will use the last 8 digits for CBE verification.
        </p>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          inputMode="numeric"
          onChange={(event) => setAccountNumber(event.target.value)}
          placeholder="Receiver account number"
          value={accountNumber}
        />
        <div className="mt-2 text-xs font-semibold text-[#45464d]">Suffix: {suffix || "missing"}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="h-11 rounded-lg bg-black text-sm font-bold text-white" disabled={suffix.length < 4} onClick={() => onSave(suffix)} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function PayScreen({ group, onCreditAdded }: { group: Group; onCreditAdded: (settledAmount: string) => void }) {
  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(360px,1fr)] lg:items-start">
        <div className="space-y-6">
          <BalanceCard balance={group.balance} groupName={group.name} />
          <PaymentInstructions />
        </div>
        <TopUpForm onCreditAdded={onCreditAdded} />
      </div>
      <SecureStatus text="Secure encrypted connection" />
    </section>
  );
}

function BalanceCard({ balance, groupName }: { balance: number; groupName: string }) {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-[#45464d]">
        <Icon name="account_balance_wallet" />
        <h2 className="text-sm font-semibold">{groupName}</h2>
      </div>
      <p className="text-2xl font-bold">{balance.toLocaleString()} ETB</p>
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

function TopUpForm({ onCreditAdded }: { onCreditAdded: (settledAmount: string) => void }) {
  const [proofName, setProofName] = useState("");
  const [preview, setPreview] = useState("");
  const [settledAmount, setSettledAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "verified">("idle");

  async function handleSubmit() {
    if (!proofName || !preview) return;
    setStatus("checking");

    try {
      const extractionResponse = await fetch("/api/vision/extract-receipt", {
        body: JSON.stringify({ image: preview }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const extractionPayload = await extractionResponse.json();

      if (!extractionResponse.ok) {
        throw new Error(extractionPayload.error || "Unable to extract top-up receipt");
      }

      const extractedAmount = extractionPayload.extracted?.amount || "0 Birr";
      setSettledAmount(extractedAmount);
      setStatus("verified");
      onCreditAdded(extractedAmount);
      window.setTimeout(() => setStatus("idle"), 400);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-5">
      <UploadField
        fileName={proofName}
        onChange={async (file) => {
          setProofName(file.name);
          setSettledAmount("");
          setPreview(await compressImage(file));
          setStatus("idle");
        }}
        onClear={() => {
          setProofName("");
          setPreview("");
          setSettledAmount("");
        }}
        preview={preview}
      />
      <PrimaryButton icon="check_circle" onClick={handleSubmit}>
        {status === "checking" ? "Verifying Telebirr payment..." : "Verify and Add Credits"}
      </PrimaryButton>
      {proofName && (
        <div className="rounded-lg border border-[#c6c6cd] bg-white p-3 text-sm font-medium text-[#45464d]">
          {status === "verified"
            ? `Payment verified. Settled amount: ${settledAmount}`
            : settledAmount
              ? `Settled amount: ${settledAmount}`
              : "Receipt ready for verification."}
        </div>
      )}
    </div>
  );
}

function UploadField({
  fileName,
  onChange,
  onClear,
  preview,
}: {
  fileName: string;
  onChange: (file: File) => void;
  onClear: () => void;
  preview: string;
}) {
  if (preview) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[#c6c6cd] bg-white shadow-sm">
        <Image alt="Top-up receipt preview" className="object-cover" fill sizes="(max-width: 768px) 100vw, 480px" src={preview} unoptimized />
        <button
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#ba1a1a] shadow-lg"
          onClick={onClear}
          type="button"
        >
          x
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-white/95 p-4 backdrop-blur">
          <p className="text-sm font-bold">{fileName}</p>
          <p className="text-xs font-semibold text-[#45464d]">Receipt ready for Telebirr verification</p>
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">Proof of Payment</span>
      <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c6c6cd] bg-white p-8 text-center transition hover:bg-[#eff4ff]">
        <Icon className="mb-3 rounded-full bg-[#e5eeff] p-3 text-black" name="upload_file" size={48} />
        <span className="text-sm font-semibold">{fileName || "Tap to upload or drag and drop"}</span>
        <span className="mt-1 text-xs font-medium text-[#76777d]">JPG, PNG, PDF, max 5MB</span>
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(file);
          }}
          type="file"
        />
      </div>
    </label>
  );
}

function ManageScreen({
  groups,
  onChangeGroups,
  onSelectGroup,
  selectedGroup,
}: {
  groups: Group[];
  onChangeGroups: (groups: Group[]) => void;
  onSelectGroup: (id: number) => void;
  selectedGroup: Group;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [menuGroupId, setMenuGroupId] = useState<number | null>(null);
  const [memberPhone, setMemberPhone] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const activeGroup = viewingGroup ? groups.find((group) => group.id === viewingGroup.id) || viewingGroup : null;

  function updateSelectedGroup(update: (group: Group) => Group) {
    onChangeGroups(groups.map((group) => (group.id === selectedGroup.id ? update(group) : group)));
  }

  function createGroup() {
    if (!newGroupName.trim()) return;
    const group: Group = {
      balance: 0,
      id: Date.now(),
      isOwner: true,
      members: [],
      name: newGroupName.trim(),
    };
    onChangeGroups([...groups, group]);
    onSelectGroup(group.id);
    setNewGroupName("");
    setShowCreateGroup(false);
  }

  function addMember() {
    if (!activeGroup || !memberPhone.trim() || !activeGroup.isOwner) return;
    const digits = memberPhone.replace(/\D/g, "");
    const member: Member = {
      initials: `M${activeGroup.members.length + 1}`,
      name: `Member ${activeGroup.members.length + 1}`,
      phone: digits ? `+${digits}` : memberPhone,
      scans: 0,
    };
    onChangeGroups(groups.map((group) => (group.id === activeGroup.id ? { ...group, members: [...group.members, member] } : group)));
    setMemberPhone("");
  }

  function updateGroup(id: number, update: (group: Group) => Group) {
    onChangeGroups(groups.map((group) => (group.id === id ? update(group) : group)));
  }

  if (activeGroup) {
    return (
      <section className="space-y-6">
        <button className="text-sm font-bold text-[#45464d]" onClick={() => setViewingGroup(null)} type="button">
          ← Groups
        </button>
        <GroupOverview
          group={activeGroup}
          onEditBudget={activeGroup.isOwner ? () => setEditingBudget(true) : undefined}
        />
        <TeamMembers
          group={activeGroup}
          memberPhone={memberPhone}
          onAddMember={addMember}
          onMemberPhoneChange={setMemberPhone}
          onRemoveMember={(phone) =>
            updateGroup(activeGroup.id, (group) => ({ ...group, members: group.members.filter((member) => member.phone !== phone) }))
          }
        />
        {editingBudget && (
          <BudgetEditModal
            group={activeGroup}
            onClose={() => setEditingBudget(false)}
            onSave={(balance) => {
              updateGroup(activeGroup.id, (group) => ({ ...group, balance }));
              setEditingBudget(false);
            }}
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white" onClick={() => setShowCreateGroup(true)} type="button">
        <Icon name="person_add" size={20} />
        Create Group
      </button>
      <GroupsList
        groups={groups}
        menuGroupId={menuGroupId}
        onDelete={(id) => {
          onChangeGroups(groups.filter((group) => group.id !== id));
          setMenuGroupId(null);
        }}
        onEdit={(group) => {
          setEditingGroup(group);
          setNewGroupName(group.name);
          setMenuGroupId(null);
        }}
        onMenu={setMenuGroupId}
        onSelect={(group) => {
          onSelectGroup(group.id);
          setViewingGroup(group);
        }}
      />
      {showCreateGroup && (
        <GroupNameModal
          title="Create Group"
          value={newGroupName}
          onChange={setNewGroupName}
          onClose={() => setShowCreateGroup(false)}
          onSave={createGroup}
        />
      )}
      {editingGroup && (
        <GroupNameModal
          title="Edit Group"
          value={newGroupName}
          onChange={setNewGroupName}
          onClose={() => setEditingGroup(null)}
          onSave={() => {
            updateGroup(editingGroup.id, (group) => ({ ...group, name: newGroupName.trim() || group.name }));
            setEditingGroup(null);
            setNewGroupName("");
          }}
        />
      )}
    </section>
  );
}

function CreateGroupCard({
  groupName,
  onChange,
  onCreate,
}: {
  groupName: string;
  onChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold">Create Group</h2>
      <div className="flex gap-2">
        <input
          className="h-11 min-w-0 flex-1 rounded-lg border border-[#c6c6cd] px-3 text-sm font-medium outline-none focus:border-black"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Group name"
          value={groupName}
        />
        <button className="h-11 rounded-lg bg-black px-4 text-sm font-bold text-white" onClick={onCreate} type="button">
          Create
        </button>
      </div>
    </div>
  );
}

function GroupsList({
  groups,
  menuGroupId,
  onDelete,
  onEdit,
  onMenu,
  onSelect,
}: {
  groups: Group[];
  menuGroupId: number | null;
  onDelete: (id: number) => void;
  onEdit: (group: Group) => void;
  onMenu: (id: number | null) => void;
  onSelect: (group: Group) => void;
}) {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold">Groups You Are In</h2>
      <div className="space-y-2">
        {groups.map((group) => (
          <div className={`relative rounded-lg border p-3 ${group.isOwner ? "border-[#6cf8bb] bg-[#effff8]" : "border-[#c6c6cd] bg-white"}`} key={group.id}>
            <button className="w-full text-left" onClick={() => onSelect(group)} type="button">
              <span className="block text-sm font-bold">{group.name}</span>
              <span className="text-xs font-semibold text-[#45464d]">{group.isOwner ? "Owner" : "Member"}</span>
            </button>
            <button className="absolute right-2 top-2 h-8 w-8 rounded-full text-xl font-bold" onClick={() => onMenu(menuGroupId === group.id ? null : group.id)} type="button">
              ⋯
            </button>
            {menuGroupId === group.id && (
              <div className="absolute right-2 top-11 z-20 w-32 overflow-hidden rounded-lg border border-[#c6c6cd] bg-white shadow-lg">
                <button className="block w-full px-3 py-2 text-left text-sm font-semibold" onClick={() => onEdit(group)} type="button">
                  Edit
                </button>
                <button className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#ba1a1a]" onClick={() => onDelete(group.id)} type="button">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupOverview({ group, onEditBudget }: { group: Group; onEditBudget?: () => void }) {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#131b2e] text-white">
          <Icon name="group" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <p className="text-xs font-medium text-[#45464d]">{group.isOwner ? "Owner workspace" : "Member workspace"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#e5eeff] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-[#45464d]">Budget</p>
            {onEditBudget && (
              <button className="text-xs font-bold text-black" onClick={onEditBudget} type="button">
                Edit
              </button>
            )}
          </div>
          <p className="text-base font-bold">{group.isOwner ? `${group.balance.toLocaleString()} ETB` : "Hidden"}</p>
        </div>
        <Metric icon="receipt_long" label="Members" value={String(group.members.length)} />
      </div>
    </div>
  );
}

function BudgetControls({
  amount,
  onAmountChange,
  onDecrease,
  onIncrease,
}: {
  amount: number;
  onAmountChange: (value: number) => void;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#c6c6cd] bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold">Allocate Budget</h2>
      <input
        className="mb-3 h-11 w-full rounded-lg border border-[#c6c6cd] px-3 text-sm font-medium outline-none focus:border-black"
        min={1}
        onChange={(event) => onAmountChange(Number(event.target.value || 0))}
        type="number"
        value={amount}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="h-11 rounded-lg border border-[#ba1a1a] text-sm font-bold text-[#ba1a1a]" onClick={onDecrease} type="button">
          Minimize
        </button>
        <button className="h-11 rounded-lg bg-black text-sm font-bold text-white" onClick={onIncrease} type="button">
          Add
        </button>
      </div>
    </div>
  );
}

function GroupNameModal({
  onChange,
  onClose,
  onSave,
  title,
  value,
}: {
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
  value: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-white p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Group name"
          value={value}
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="h-11 rounded-lg bg-black text-sm font-bold text-white" onClick={onSave} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetEditModal({
  group,
  onClose,
  onSave,
}: {
  group: Group;
  onClose: () => void;
  onSave: (balance: number) => void;
}) {
  const [balance, setBalance] = useState(group.balance);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-white p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">Edit Budget</h2>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          min={0}
          onChange={(event) => setBalance(Number(event.target.value || 0))}
          type="number"
          value={balance}
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="h-11 rounded-lg bg-black text-sm font-bold text-white" onClick={() => onSave(balance)} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamMembers({
  group,
  memberPhone,
  onAddMember,
  onMemberPhoneChange,
  onRemoveMember,
}: {
  group: Group;
  memberPhone: string;
  onAddMember: () => void;
  onMemberPhoneChange: (value: string) => void;
  onRemoveMember: (phone: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#45464d]">Team Members</h2>
      {group.isOwner && (
        <div className="mb-3 flex gap-2 rounded-xl border border-[#c6c6cd] bg-white p-3 shadow-sm">
          <input
            className="h-11 min-w-0 flex-1 rounded-lg border border-[#c6c6cd] px-3 text-sm font-medium outline-none focus:border-black"
            onChange={(event) => onMemberPhoneChange(event.target.value)}
            placeholder="Member phone"
            value={memberPhone}
          />
          <button className="h-11 rounded-lg bg-black px-4 text-sm font-bold text-white" onClick={onAddMember} type="button">
            Add
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-[#c6c6cd] bg-white shadow-sm">
        {group.members.map((member) => (
          <MemberRow canRemove={group.isOwner} key={member.phone} member={member} onRemove={onRemoveMember} />
        ))}
        {group.members.length === 0 && <div className="p-4 text-sm font-medium text-[#45464d]">No members yet.</div>}
      </div>
    </div>
  );
}

function MemberRow({ canRemove, member, onRemove }: { canRemove: boolean; member: Member; onRemove: (phone: string) => void }) {
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
        {canRemove && (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#ba1a1a] active:scale-95"
            onClick={() => onRemove(member.phone)}
            type="button"
          >
            <Icon name="person_remove" />
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessSheet({ onClose, result }: { onClose: () => void; result: VerificationResult | null }) {
  const checks = result?.checks || demoChecks;
  const isSuccess = checks.every((check) => check.matched);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="success-sheet max-h-[90dvh] w-full max-w-[640px] overflow-hidden rounded-t-[28px] bg-[#f8f9ff] shadow-2xl md:rounded-[28px]">
        <SuccessHeader isSuccess={isSuccess} />
        <div className="safe-modal-footer px-5 pt-6 md:pb-6">
          <SuccessDetails checks={checks} />
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

function TopUpSuccessSheet({ amount, onClose }: { amount: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="success-sheet w-full max-w-[520px] rounded-t-[28px] bg-[#f8f9ff] shadow-2xl md:rounded-[28px]">
        <div className="relative overflow-hidden bg-[#6cf8bb] px-5 py-8 text-center text-[#00714d]">
          <div className="dot-pattern absolute inset-0 opacity-20" />
          <div className="relative z-10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#006c49] text-white shadow-lg">
            <span className="text-4xl font-black leading-none">✓</span>
          </div>
          <h2 className="relative z-10 text-2xl font-bold">Credits Added</h2>
          <p className="relative z-10 mt-2 text-base font-semibold">You added {amount} ETB to your account.</p>
        </div>
        <div className="safe-modal-footer px-5 pt-6 md:pb-6">
          <PrimaryButton onClick={onClose} rounded="full">
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function getVerifyTitle({
  isProcessing,
  loadingStage,
  previewImage,
}: {
  isProcessing: boolean;
  loadingStage: LoadingStage;
  previewImage: string;
}) {
  if (loadingStage === "checking_image") return "Checking the image";
  if (loadingStage === "verifying_transaction") return "Verifying the transaction";
  if (isProcessing) return "Verifying receipt";
  if (previewImage) return "Receipt captured";

  return "Capture your receipt";
}

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Unable to process image"));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Unable to load image"));
    };

    image.src = source;
  });
}

function parseSettledAmount(settledAmount: string) {
  const amount = Number(settledAmount.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function getTelebirrSettledAmount(providerResponse: unknown) {
  if (providerResponse && typeof providerResponse === "object") {
    const response = providerResponse as {
      settledAmount?: string;
      totalPaidAmount?: string;
      data?: {
        settledAmount?: string;
        totalPaidAmount?: string;
      };
    };

    return (
      response.settledAmount ||
      response.data?.settledAmount ||
      response.totalPaidAmount ||
      response.data?.totalPaidAmount ||
      "0 Birr"
    );
  }

  return "0 Birr";
}

async function pollVerificationJob(jobId: string, onStage: (stage: LoadingStage) => void): Promise<PollResult> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`/api/verification-jobs/${jobId}`, { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Verification job not found");
    }

    if (payload.job.stage === "checking_image") {
      onStage("checking_image");
    }

    if (payload.job.stage === "verifying_transaction") {
      onStage("verifying_transaction");
    }

    if (payload.job.stage === "needs_cbe_suffix") {
      return { extracted: payload.job.extracted, type: "needs_cbe_suffix" };
    }

    if (payload.job.stage === "completed") {
      return { result: payload.job.result as VerificationResult, type: "completed" };
    }

    if (payload.job.stage === "failed") {
      throw new Error(payload.job.error || "Verification failed");
    }

    await wait(1000);
  }

  throw new Error("Verification timed out");
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildFailedResult(
  extracted: VerificationResult["extracted"] | null,
  reason: string,
): VerificationResult {
  const fallback = extracted || {
    accountSuffix: "",
    amount: "",
    time: "",
    provider: "telebirr" as const,
    receiptUrl: "",
    transactionNumber: "",
    transactionTo: "",
  };

  return {
    checks: [
      {
        key: "provider",
        label: "Provider",
        matched: Boolean(extracted),
        receiptValue: fallback.provider,
        verifiedValue: extracted ? fallback.provider : reason,
      },
      {
        key: "time",
        label: "Time",
        matched: false,
        receiptValue: fallback.time,
        verifiedValue: reason,
      },
      {
        key: "transactionTo",
        label: "Transaction To",
        matched: false,
        receiptValue: fallback.transactionTo,
        verifiedValue: reason,
      },
      {
        key: "transactionNumber",
        label: "Transaction Number",
        matched: false,
        receiptValue: fallback.transactionNumber,
        verifiedValue: reason,
      },
    ],
    extracted: fallback,
    isSuccess: false,
    normalized: fallback,
    providerResponse: { error: reason },
  };
}

function SuccessHeader({ isSuccess }: { isSuccess: boolean }) {
  return (
    <div
      className={`relative overflow-hidden px-5 py-8 text-center ${
        isSuccess ? "bg-[#6cf8bb] text-[#00714d]" : "bg-[#ffdad6] text-[#93000a]"
      }`}
    >
      <div className="dot-pattern absolute inset-0 opacity-20" />
      <div
        className={`success-pulse relative z-10 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg ${
          isSuccess ? "bg-[#006c49]" : "bg-[#ba1a1a]"
        }`}
      >
        <span className="text-5xl font-black leading-none">{isSuccess ? "✓" : "×"}</span>
      </div>
      <h2 className="relative z-10 text-3xl font-bold">{isSuccess ? "ተረጋግጧል" : "አጠራጣሪ"}</h2>
      <p className="relative z-10 mt-1 text-base font-medium">
        {isSuccess ? "All receipt fields matched the provider record." : "One or more receipt fields did not match."}
      </p>
    </div>
  );
}

function SuccessDetails({ checks }: { checks: VerificationCheck[] }) {
  return (
    <div className="rounded-lg border border-[#c6c6cd] bg-white p-4 shadow-sm">
      {checks.map((check, index) => (
        <CheckRow check={check} key={check.key} last={index === checks.length - 1} />
      ))}
    </div>
  );
}

function CheckRow({ check, last }: { check: VerificationCheck; last: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${last ? "" : "border-b border-[#e5eeff]"}`}>
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
          check.matched ? "bg-[#006c49]" : "bg-[#ba1a1a]"
        }`}
      >
        {check.matched ? "✓" : "×"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{check.label}</p>
        <p className="truncate text-xs font-medium text-[#45464d]">Receipt: {check.receiptValue || "Missing"}</p>
        <p className="truncate text-xs font-medium text-[#45464d]">Verified: {check.verifiedValue || "Missing"}</p>
      </div>
    </div>
  );
}
