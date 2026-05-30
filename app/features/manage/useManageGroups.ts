"use client";

import { useState } from "react";
import type { Group, Member } from "../groups/types";

export function useManageGroups({
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
  const [budgetDraft, setBudgetDraft] = useState(selectedGroup.balance);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [menuGroupId, setMenuGroupId] = useState<number | null>(null);
  const [memberPhone, setMemberPhone] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [viewingGroupId, setViewingGroupId] = useState<number | null>(null);
  const activeGroup = viewingGroupId ? groups.find((group) => group.id === viewingGroupId) || null : null;

  function createGroup() {
    if (!newGroupName.trim()) return;
    const group: Group = {
      balance: 0,
      id: Date.now(),
      isOwner: true,
      members: [],
      name: newGroupName.trim(),
      providerMix: [{ label: "Telebirr", value: 100 }],
      revenueToday: 0,
      successRate: 100,
      todayScans: 0,
    };
    onChangeGroups([...groups, group]);
    onSelectGroup(group.id);
    setViewingGroupId(group.id);
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
    updateGroup(activeGroup.id, (group) => ({ ...group, members: [...group.members, member] }));
    setMemberPhone("");
  }

  function deleteGroup(id: number) {
    onChangeGroups(groups.filter((group) => group.id !== id));
    setMenuGroupId(null);
  }

  function editGroup(group: Group) {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setMenuGroupId(null);
  }

  function saveGroupName() {
    if (!editingGroup) return;
    updateGroup(editingGroup.id, (group) => ({ ...group, name: newGroupName.trim() || group.name }));
    setEditingGroup(null);
    setNewGroupName("");
  }

  function openBudgetEdit(group: Group) {
    setBudgetDraft(group.balance);
    setEditingBudget(true);
  }

  function saveBudget() {
    if (!activeGroup) return;
    updateGroup(activeGroup.id, (group) => ({ ...group, balance: budgetDraft }));
    setEditingBudget(false);
  }

  function selectGroup(group: Group) {
    onSelectGroup(group.id);
    setViewingGroupId(group.id);
  }

  function updateGroup(id: number, update: (group: Group) => Group) {
    onChangeGroups(groups.map((group) => (group.id === id ? update(group) : group)));
  }

  return {
    activeGroup,
    addMember,
    budgetDraft,
    createGroup,
    deleteGroup,
    editGroup,
    editingBudget,
    editingGroup,
    groups,
    memberPhone,
    menuGroupId,
    newGroupName,
    openBudgetEdit,
    saveBudget,
    saveGroupName,
    selectGroup,
    setBudgetDraft,
    setEditingBudget,
    setEditingGroup,
    setMemberPhone,
    setMenuGroupId,
    setNewGroupName,
    setShowCreateGroup,
    setViewingGroupId,
    showCreateGroup,
    updateGroup,
  };
}

export type ManageGroupsState = ReturnType<typeof useManageGroups>;
