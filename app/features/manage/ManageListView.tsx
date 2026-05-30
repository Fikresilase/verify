"use client";

import { Icon } from "@/app/components/Icon";
import type { Group } from "../groups/types";
import type { ManageGroupsState } from "./useManageGroups";

export function ManageListView({ state }: { state: ManageGroupsState }) {
  return (
    <section className="space-y-4">
      <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-sm font-bold text-[#fbfdfb] shadow-[0_16px_34px_-22px_rgba(17,24,39,0.8)]" onClick={() => state.setShowCreateGroup(true)} type="button">
        <Icon name="person_add" size={20} />
        Create Group
      </button>
      <GroupsList
        groups={state.groups}
        menuGroupId={state.menuGroupId}
        onDelete={state.deleteGroup}
        onEdit={state.editGroup}
        onMenu={state.setMenuGroupId}
        onSelect={state.selectGroup}
      />
    </section>
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
    <div className="surface-line rounded-lg border bg-[#fbfdfb] p-4">
      <h2 className="mb-3 text-base font-bold">Groups You Are In</h2>
      <div className="space-y-2">
        {groups.map((group) => (
          <div className={`relative rounded-lg border p-3 ${group.isOwner ? "border-[#bfead1] bg-[#effff8]" : "border-[#d8e4f1] bg-[#fbfdfb]"}`} key={group.id}>
            <button className="w-full text-left" onClick={() => onSelect(group)} type="button">
              <span className="block pr-8 text-sm font-bold">{group.name}</span>
              <span className="mt-1 block text-xs font-semibold text-[#45464d]">
                {group.isOwner ? "Owner" : "Member"} - {group.todayScans} scans today - {group.successRate}% verified
              </span>
              <span className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                <span className="rounded bg-[#fbfdfb]/80 px-2 py-1 text-[#0b1c30]">{group.revenueToday.toLocaleString()} ETB</span>
                <span className="rounded bg-[#fbfdfb]/80 px-2 py-1 text-[#006c49]">{group.balance.toLocaleString()} ETB left</span>
              </span>
            </button>
            <button className="absolute right-2 top-2 h-8 w-8 rounded-full text-xl font-bold" onClick={() => onMenu(menuGroupId === group.id ? null : group.id)} type="button">
              ...
            </button>
            {menuGroupId === group.id && <GroupMenu group={group} onDelete={onDelete} onEdit={onEdit} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupMenu({ group, onDelete, onEdit }: { group: Group; onDelete: (id: number) => void; onEdit: (group: Group) => void }) {
  return (
    <div className="absolute right-2 top-11 z-20 w-32 overflow-hidden rounded-lg border border-[#d8e4f1] bg-[#fbfdfb] shadow-[0_18px_44px_-28px_rgba(17,24,39,0.7)]">
      <button className="block w-full px-3 py-2 text-left text-sm font-semibold" onClick={() => onEdit(group)} type="button">
        Edit
      </button>
      <button className="block w-full px-3 py-2 text-left text-sm font-semibold text-[#ba1a1a]" onClick={() => onDelete(group.id)} type="button">
        Delete
      </button>
    </div>
  );
}
