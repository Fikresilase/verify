"use client";

import { Icon } from "@/app/components/Icon";
import type { Group, Member } from "../groups/types";

export function TeamMembers({
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
        <div className="surface-line mb-3 flex gap-2 rounded-lg border bg-[#fbfdfb] p-3">
          <input className="h-11 min-w-0 flex-1 rounded-lg border border-[#c6c6cd] px-3 text-sm font-medium outline-none focus:border-[#111827]" onChange={(event) => onMemberPhoneChange(event.target.value)} placeholder="Member phone" value={memberPhone} />
          <button className="h-11 rounded-lg bg-[#111827] px-4 text-sm font-bold text-[#fbfdfb]" onClick={onAddMember} type="button">Add</button>
        </div>
      )}
      <div className="surface-line overflow-hidden rounded-lg border bg-[#fbfdfb]">
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3e4fe] text-sm font-bold">{member.initials}</div>
        <div>
          <p className="text-sm font-semibold">{member.name}</p>
          <p className="text-xs font-medium text-[#45464d]">{member.phone}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="hidden text-xs font-semibold text-[#45464d] min-[390px]:inline">{member.scans} scans</span>
        {canRemove && (
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#ba1a1a] active:scale-95" onClick={() => onRemove(member.phone)} type="button">
            <Icon name="person_remove" />
          </button>
        )}
      </div>
    </div>
  );
}
