"use client";

export function GroupNameModal({
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
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-[#fbfdfb] p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Group name"
          value={value}
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">Cancel</button>
          <button className="h-11 rounded-lg bg-[#111827] text-sm font-bold text-[#fbfdfb]" onClick={onSave} type="button">Save</button>
        </div>
      </div>
    </div>
  );
}

export function BudgetEditModal({
  balance,
  onBalanceChange,
  onClose,
  onSave,
}: {
  balance: number;
  onBalanceChange: (balance: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#213145]/70 md:items-center">
      <div className="w-full max-w-[420px] rounded-t-[24px] bg-[#fbfdfb] p-5 pb-10 shadow-2xl md:rounded-[24px] md:pb-5">
        <h2 className="text-xl font-bold">Edit Budget</h2>
        <input
          className="mt-4 h-12 w-full rounded-lg border border-[#c6c6cd] px-3 text-base font-medium outline-none focus:border-black"
          min={0}
          onChange={(event) => onBalanceChange(Number(event.target.value || 0))}
          type="number"
          value={balance}
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-11 rounded-lg border border-[#c6c6cd] text-sm font-bold" onClick={onClose} type="button">Cancel</button>
          <button className="h-11 rounded-lg bg-[#111827] text-sm font-bold text-[#fbfdfb]" onClick={onSave} type="button">Save</button>
        </div>
      </div>
    </div>
  );
}
