import type { ReactNode } from "react";
import { Icon } from "./Icon";

export type Tab = "verify" | "pay" | "manage";

export const tabs: Array<{ id: Tab; label: string; icon: Parameters<typeof Icon>[0]["name"] }> = [
  { id: "verify", label: "Verify", icon: "verified_user" },
  { id: "pay", label: "Pay", icon: "payments" },
  { id: "manage", label: "Manage", icon: "settings" },
];

export function AppHeader({ platform, username }: { platform?: string; username?: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#d8e4f1]/70 bg-[#fbfdfb]/90 shadow-[0_10px_36px_rgba(11,28,48,0.07)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-end justify-between px-4 pb-3 sm:px-5 md:h-14 md:items-center md:px-8 md:pb-0">
        <div className="flex items-center gap-3 text-[#111827]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111827] text-[#fbfdfb] shadow-[0_16px_34px_-22px_rgba(17,24,39,0.8)] md:h-9 md:w-9">
            <Icon name="security" size={22} />
          </div>
          <div>
            <span className="block text-lg font-black leading-5">Verify Hub</span>
            {(username || platform) && (
              <span className="block text-[11px] font-semibold leading-4 text-[#45464d]">
                {username ? `@${username}` : "Telegram"} {platform ? `on ${platform}` : ""}
              </span>
            )}
            {!username && !platform && <span className="block text-[11px] font-semibold leading-4 text-[#45464d]">Receipt verification console</span>}
          </div>
        </div>
        <BalancePill />
      </div>
    </header>
  );
}

export function DesktopSidebar({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100dvh-96px)] w-64 shrink-0 rounded-lg border border-[#172235] bg-[#111827] p-3 text-[#fbfdfb] shadow-[0_24px_70px_rgba(13,23,36,0.18)] md:relative md:block">
      <div className="mb-4 rounded-lg border border-[#fbfdfb]/10 bg-[#fbfdfb]/[0.04] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8fa7c2]">Live Workspace</p>
          <span className="rounded-full bg-[#6cf8bb] px-2 py-0.5 text-[10px] font-black text-[#006c49]">Demo</span>
        </div>
        <p className="text-xl font-black">Resto-A Group</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-[#b8c7d9]">
          <div className="rounded bg-[#fbfdfb]/[0.06] p-2">
            <span className="block text-[#fbfdfb]">36</span>
            scans today
          </div>
          <div className="rounded bg-[#fbfdfb]/[0.06] p-2">
            <span className="block text-[#fbfdfb]">12.5k</span>
            ETB tracked
          </div>
        </div>
      </div>
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              className={
                isActive
                  ? "flex h-12 w-full items-center gap-3 rounded-lg bg-[#d9fbe9] px-4 text-left text-sm font-bold text-[#006c49]"
                  : "flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-semibold text-[#b8c7d9] hover:bg-[#fbfdfb]/10 hover:text-[#fbfdfb]"
              }
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} size={22} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="absolute inset-x-3 bottom-3 rounded-lg border border-[#fbfdfb]/10 bg-[#fbfdfb]/[0.04] p-3 text-xs font-semibold text-[#b8c7d9]">
        <div className="mb-2 flex items-center justify-between">
          <span>Success rate</span>
          <span className="text-[#6cf8bb]">98%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#fbfdfb]/10">
          <div className="h-full w-[98%] rounded-full bg-[#6cf8bb]" />
        </div>
      </div>
    </aside>
  );
}

export function BalancePill() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#c6c6cd] bg-[#fbfdfb] px-3 py-1 text-sm font-bold text-[#0b1c30] shadow-sm">
      <span className="h-2 w-2 rounded-full bg-[#16a36b]" />
      <span>2,450 ETB</span>
    </div>
  );
}

export function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-lg border-t border-[#c6c6cd] bg-[#fbfdfb]/94 px-4 py-2 shadow-[0_-12px_38px_rgba(11,28,48,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[680px] items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              className={
                isActive
                  ? "flex min-w-20 flex-col items-center justify-center rounded-full bg-[#d9fbe9] px-4 py-1 text-[#00714d] active:scale-95"
                  : "flex min-w-20 flex-col items-center justify-center rounded-lg p-2 text-[#45464d] active:scale-95"
              }
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} size={22} />
              <span className="mt-1 text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold leading-8 tracking-normal">{title}</h1>
      <p className="mt-1 text-base text-[#45464d]">{description}</p>
    </div>
  );
}

export function SecureStatus({ text }: { text: string }) {
  return (
    <div className="mx-auto flex w-fit items-center justify-center gap-1.5 rounded-full border border-[#bfead1] bg-[#fbfdfb]/75 px-3 py-1.5 text-xs font-bold text-[#006c49] shadow-sm backdrop-blur">
      <Icon name="lock" size={16} />
      <span>{text}</span>
    </div>
  );
}

export function PrimaryButton({
  children,
  icon,
  onClick,
  rounded = "lg",
  type = "button",
}: {
  children: ReactNode;
  icon?: Parameters<typeof Icon>[0]["name"];
  onClick?: () => void;
  rounded?: "lg" | "full";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`flex h-12 w-full items-center justify-center gap-2 bg-[#111827] text-sm font-bold text-[#fbfdfb] shadow-[0_16px_34px_-22px_rgba(17,24,39,0.8)] active:scale-[0.98] ${
        rounded === "full" ? "rounded-full" : "rounded-lg"
      }`}
      onClick={onClick}
      type={type}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}

export function IconButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: Parameters<typeof Icon>[0]["name"];
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#76777d] bg-[#fbfdfb] text-sm font-semibold shadow-sm active:scale-[0.98]"
      onClick={onClick}
      type="button"
    >
      <Icon name={icon} size={20} />
      {children}
    </button>
  );
}

export function Metric({ label, value, icon }: { label: string; value: string; icon: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <div className="surface-line rounded-lg border bg-[#fbfdfb] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-[#45464d]">{label}</p>
        <Icon className="text-[#00714d]" name={icon} size={20} />
      </div>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

export function DetailRow({
  icon,
  label,
  value,
  strong = false,
  code = false,
  last = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string;
  strong?: boolean;
  code?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${last ? "" : "border-b border-[#e5eeff]"}`}>
      <span className="flex items-center gap-2 text-base text-[#45464d]">
        <Icon className="text-[#76777d]" name={icon} size={20} />
        {label}
      </span>
      <span className={`${strong ? "font-bold" : "font-medium"} ${code ? "font-mono text-sm" : "text-sm"} text-right`}>
        {value}
      </span>
    </div>
  );
}
