"use client";

import type { Group } from "../groups/types";
import { BudgetEditModal, GroupNameModal } from "./GroupModals";
import { ManageDetailView } from "./ManageDetailView";
import { ManageListView } from "./ManageListView";
import { useManageGroups } from "./useManageGroups";

export function ManageScreen({
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
  const state = useManageGroups({ groups, onChangeGroups, onSelectGroup, selectedGroup });

  return (
    <>
      {state.activeGroup ? <ManageDetailView state={state} /> : <ManageListView state={state} />}
      {state.showCreateGroup && (
        <GroupNameModal
          onChange={state.setNewGroupName}
          onClose={() => state.setShowCreateGroup(false)}
          onSave={state.createGroup}
          title="Create Group"
          value={state.newGroupName}
        />
      )}
      {state.editingGroup && (
        <GroupNameModal
          onChange={state.setNewGroupName}
          onClose={() => state.setEditingGroup(null)}
          onSave={state.saveGroupName}
          title="Edit Group"
          value={state.newGroupName}
        />
      )}
      {state.activeGroup && state.editingBudget && (
        <BudgetEditModal
          balance={state.budgetDraft}
          onBalanceChange={state.setBudgetDraft}
          onClose={() => state.setEditingBudget(false)}
          onSave={state.saveBudget}
        />
      )}
    </>
  );
}
