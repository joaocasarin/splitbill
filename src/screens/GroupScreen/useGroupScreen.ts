import type { DirectDebt } from "@domain/balance";
import { computeBalances, computeDirectDebts } from "@domain/balance";
import type { EntityId } from "@domain/common";
import type { Expense } from "@domain/expense";
import type { Group } from "@domain/group";
import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { useAppStore } from "@store";
import { useState } from "react";
import type { MemberRow } from "./members/MembersSection";

type GroupNotFound = { group: null };

type GroupFound = {
    group: Group;
    users: User[];
    members: MemberRow[];
    memberCount: number;
    canAddMember: boolean;
    directDebts: DirectDebt[];
    editDirectDebts: DirectDebt[];
    isAddMemberOpen: boolean;
    editingExpense: Expense | null;
    isAddExpenseOpen: boolean;
    isAddSettlementOpen: boolean;
    editingSettlement: Settlement | null;
    openAddMember: () => void;
    closeAddMember: () => void;
    openAddExpense: () => void;
    closeAddExpense: () => void;
    openEditExpense: (expense: Expense) => void;
    closeEditExpense: () => void;
    openAddSettlement: () => void;
    closeAddSettlement: () => void;
    openEditSettlement: (settlement: Settlement) => void;
    closeEditSettlement: () => void;
    removeMember: (id: EntityId) => void;
    addSettlement: (settlement: Omit<Settlement, "id">) => void;
    updateSettlement: (settlement: Settlement) => void;
    deleteExpense: (expenseId: EntityId) => void;
    deleteSettlement: (settlementId: EntityId) => void;
};

export type UseGroupScreenReturn = GroupNotFound | GroupFound;

export function useGroupScreen(groupId: EntityId): UseGroupScreenReturn {
    const {
        global,
        removeMemberFromGroup,
        addSettlement: storeAddSettlement,
        updateSettlement: storeUpdateSettlement,
        deleteExpense: storeDeleteExpense,
        deleteSettlement: storeDeleteSettlement,
    } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isAddSettlementOpen, setIsAddSettlementOpen] = useState(false);
    const [editingSettlement, setEditingSettlement] =
        useState<Settlement | null>(null);

    if (!group) {
        return { group: null };
    }

    const balances = computeBalances(group);
    const directDebts = computeDirectDebts(group);

    const getUserName = (id: EntityId) =>
        users.find((u) => u.id === id)?.name ?? `User ${id}`;

    const members: MemberRow[] = group.memberIds.map((id) => {
        const balance = balances.find((b) => b.memberId === id);
        const owes = directDebts
            .filter((d) => d.fromMemberId === id)
            .map((d) => ({
                name: getUserName(d.toMemberId),
                amount: d.amount,
            }));
        const receives = directDebts
            .filter((d) => d.toMemberId === id)
            .map((d) => ({
                name: getUserName(d.fromMemberId),
                amount: d.amount,
            }));
        return {
            id,
            name: getUserName(id),
            amount: balance?.amount ?? 0,
            owes,
            receives,
        };
    });

    const nonMembers = users.filter((u) => !group.memberIds.includes(u.id));
    const canAddMember = nonMembers.length > 0;
    const editDirectDebts = editingSettlement
        ? computeDirectDebts({
              ...group,
              settlements: group.settlements.filter(
                  (s) => s.id !== editingSettlement.id,
              ),
          })
        : directDebts;

    return {
        group,
        users,
        members,
        memberCount: group.memberIds.length,
        canAddMember,
        directDebts,
        editDirectDebts,
        isAddMemberOpen,
        editingExpense,
        isAddExpenseOpen,
        isAddSettlementOpen,
        editingSettlement,
        openAddMember: () => setIsAddMemberOpen(true),
        closeAddMember: () => setIsAddMemberOpen(false),
        openAddExpense: () => setIsAddExpenseOpen(true),
        closeAddExpense: () => setIsAddExpenseOpen(false),
        openEditExpense: (expense: Expense) => setEditingExpense(expense),
        closeEditExpense: () => setEditingExpense(null),
        openAddSettlement: () => setIsAddSettlementOpen(true),
        closeAddSettlement: () => setIsAddSettlementOpen(false),
        openEditSettlement: (settlement: Settlement) =>
            setEditingSettlement(settlement),
        closeEditSettlement: () => setEditingSettlement(null),
        removeMember: (id: EntityId) => removeMemberFromGroup(groupId, id),
        addSettlement: (settlement: Omit<Settlement, "id">) =>
            storeAddSettlement(groupId, settlement),
        updateSettlement: (settlement: Settlement) =>
            storeUpdateSettlement(groupId, settlement),
        deleteExpense: (expenseId: EntityId) =>
            storeDeleteExpense(groupId, expenseId),
        deleteSettlement: (settlementId: EntityId) =>
            storeDeleteSettlement(groupId, settlementId),
    };
}
