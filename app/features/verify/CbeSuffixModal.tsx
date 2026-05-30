"use client";

export function CbeSuffixModal({
  accountNumber,
  onAccountNumberChange,
  onClose,
  onSave,
  suffix,
}: {
  accountNumber: string;
  onAccountNumberChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  suffix: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-[#fbfdfb] p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">Receiver account</h2>
        <p className="mt-2 text-sm font-medium leading-5 text-[#45464d]">
          Enter the receiver account number. We will use the last 8 digits for CBE verification.
        </p>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          inputMode="numeric"
          onChange={(event) => onAccountNumberChange(event.target.value)}
          placeholder="Receiver account number"
          value={accountNumber}
        />
        <div className="mt-2 text-xs font-semibold text-[#45464d]">Suffix: {suffix || "missing"}</div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="h-11 rounded-lg bg-[#111827] text-sm font-bold text-[#fbfdfb] disabled:cursor-not-allowed disabled:bg-[#9aa6b2]" disabled={suffix.length < 4} onClick={onSave} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
