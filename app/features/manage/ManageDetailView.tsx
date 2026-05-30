"use client";

import { Icon } from "@/app/components/Icon";
import { Metric } from "@/app/components/ui";
import type { Group } from "../groups/types";
import { TeamMembers } from "./TeamMembers";
import type { ManageGroupsState } from "./useManageGroups";

export function ManageDetailView({ state }: { state: ManageGroupsState }) {
  const group = state.activeGroup;
  if (!group) return null;

  return (
    <section className="space-y-6">
      <button className="text-sm font-bold text-[#45464d]" onClick={() => state.setViewingGroupId(null)} type="button">
        Back to groups
      </button>
      <GroupOverview group={group} onEditBudget={group.isOwner ? () => state.openBudgetEdit(group) : undefined} />
      <TeamMembers
        group={group}
        memberPhone={state.memberPhone}
        onAddMember={state.addMember}
        onMemberPhoneChange={state.setMemberPhone}
        onRemoveMember={(phone) =>
          state.updateGroup(group.id, (current) => ({ ...current, members: current.members.filter((member) => member.phone !== phone) }))
        }
      />
    </section>
  );
}

function GroupOverview({ group, onEditBudget }: { group: Group; onEditBudget?: () => void }) {
  return (
    <div className="surface-line rounded-lg border bg-[#fbfdfb] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#131b2e] text-[#fbfdfb]">
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
            {onEditBudget && <button className="text-xs font-bold text-[#111827]" onClick={onEditBudget} type="button">Edit</button>}
          </div>
          <p className="text-base font-bold">{group.isOwner ? `${group.balance.toLocaleString()} ETB` : "Hidden"}</p>
        </div>
        <Metric icon="receipt_long" label="Today" value={`${group.todayScans} scans`} />
        <Metric icon="trending_up" label="Success Rate" value={`${group.successRate}%`} />
        <Metric icon="payments" label="Revenue Today" value={`${group.revenueToday.toLocaleString()} ETB`} />
      </div>
      <div className="mt-4 rounded-lg border border-[#d8e4f1] bg-[#f8fbff] p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#45464d]">Provider Mix</p>
        <div className="space-y-2">
          {group.providerMix.map((provider) => (
            <div className="grid grid-cols-[76px_1fr_40px] items-center gap-2 text-xs font-bold" key={provider.label}>
              <span>{provider.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[#d8e4f1]">
                <span className="block h-full rounded-full bg-[#16a36b]" style={{ width: `${provider.value}%` }} />
              </span>
              <span className="text-right text-[#45464d]">{provider.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
