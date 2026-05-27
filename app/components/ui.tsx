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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#c6c6cd] bg-[#f8f9ff]/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-end justify-between px-5 pb-3 md:h-14 md:items-center md:px-8 md:pb-0">
        <div className="flex items-center gap-2 text-black">
          <Icon name="security" size={24} />
          <div>
            <span className="block text-lg font-bold leading-5">Verification Hub</span>
            {(username || platform) && (
              <span className="block text-[11px] font-semibold leading-4 text-[#45464d]">
                {username ? `@${username}` : "Telegram"} {platform ? `on ${platform}` : ""}
              </span>
            )}
          </div>
        </div>
        <BalancePill />
      </div>
    </header>
  );
}

export function DesktopSidebar({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100dvh-96px)] w-64 shrink-0 rounded-xl border border-[#c6c6cd] bg-white p-3 shadow-sm md:block">
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              className={
                isActive
                  ? "flex h-12 w-full items-center gap-3 rounded-lg bg-[#6cf8bb] px-4 text-left text-sm font-semibold text-[#00714d]"
                  : "flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-semibold text-[#45464d] hover:bg-[#eff4ff]"
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
    </aside>
  );
}

export function BalancePill() {
  return (
    <div className="rounded-full border border-[#c6c6cd] bg-[#e5eeff] px-3 py-1 text-sm font-semibold text-[#45464d]">
      2,450 ETB
    </div>
  );
}

export function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-xl border-t border-[#c6c6cd] bg-[#f8f9ff] px-4 py-2 shadow-lg md:hidden">
      <div className="mx-auto flex max-w-[680px] items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              className={
                isActive
                  ? "flex min-w-20 flex-col items-center justify-center rounded-full bg-[#6cf8bb] px-4 py-1 text-[#00714d] active:scale-95"
                  : "flex min-w-20 flex-col items-center justify-center rounded-lg p-2 text-[#45464d] active:scale-95"
              }
              key={tab.id}
              onClick={() => onChange(tab.id)}
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
    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#006c49]">
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
      className={`flex h-12 w-full items-center justify-center gap-2 bg-black text-sm font-semibold text-white shadow-sm active:scale-[0.98] ${
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
      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#76777d] bg-white text-sm font-semibold shadow-sm active:scale-95"
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
    <div className="rounded-lg bg-[#e5eeff] p-4">
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
