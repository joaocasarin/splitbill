import type { DirectDebt } from "@domain/balance";
import { computeBalances, computeDirectDebts } from "@domain/balance";
import { type EntityId, GROUP_MEMBERS_MAX } from "@domain/common";
import type { Expense } from "@domain/expense";
import type { Group } from "@domain/group";
import type { CreateSettlement, Settlement } from "@domain/settlement";
import { useAppStore } from "@store";
import { useState } from "react";
import type { MemberRow } from "./members/MembersSection";

type GroupNotFound = { group: null };

type GroupFound = {
    group: Group;
    members: MemberRow[];
    memberCount: number;
    canAddMember: boolean;
    directDebts: DirectDebt[];
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
    addSettlement: (settlement: CreateSettlement) => void;
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
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isAddSettlementOpen, setIsAddSettlementOpen] = useState(false);
    const [editingSettlement, setEditingSettlement] =
        useState<Settlement | null>(null);

    if (!group) {
        return { group: null };
    }

    const groupMembers = group.members;
    const balances = computeBalances(group);
    const directDebts = computeDirectDebts(group);

    const getMemberName = (id: EntityId) =>
        groupMembers.find((m) => m.id === id)?.name ?? `User ${id}`;

    const members: MemberRow[] = groupMembers.map((member) => {
        const balance = balances.find((b) => b.memberId === member.id);
        const owes = directDebts
            .filter((d) => d.fromMemberId === member.id)
            .map((d) => ({
                name: getMemberName(d.toMemberId),
                amount: d.amount,
            }));
        const receives = directDebts
            .filter((d) => d.toMemberId === member.id)
            .map((d) => ({
                name: getMemberName(d.fromMemberId),
                amount: d.amount,
            }));
        return {
            id: member.id,
            name: member.name,
            amount: balance?.amount ?? 0,
            owes,
            receives,
        };
    });

    const canAddMember = groupMembers.length < GROUP_MEMBERS_MAX;

    return {
        group,
        members,
        memberCount: groupMembers.length,
        canAddMember,
        directDebts,
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
        addSettlement: (settlement: CreateSettlement) =>
            storeAddSettlement(groupId, settlement),
        updateSettlement: (settlement: Settlement) =>
            storeUpdateSettlement(groupId, settlement),
        deleteExpense: (expenseId: EntityId) =>
            storeDeleteExpense(groupId, expenseId),
        deleteSettlement: (settlementId: EntityId) =>
            storeDeleteSettlement(groupId, settlementId),
    };
}
