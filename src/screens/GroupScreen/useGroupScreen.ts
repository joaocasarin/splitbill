import type { DirectDebt } from "@domain/balance";
import { computeBalances, computeDirectDebts } from "@domain/balance";
import type { EntityId } from "@domain/common";
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
    isAddMemberOpen: boolean;
    isAddExpenseOpen: boolean;
    isAddSettlementOpen: boolean;
    openAddMember: () => void;
    closeAddMember: () => void;
    openAddExpense: () => void;
    closeAddExpense: () => void;
    openAddSettlement: () => void;
    closeAddSettlement: () => void;
    removeMember: (id: EntityId) => void;
    addSettlement: (settlement: Omit<Settlement, "id">) => void;
    deleteExpense: (expenseId: EntityId) => void;
    deleteSettlement: (settlementId: EntityId) => void;
};

export type UseGroupScreenReturn = GroupNotFound | GroupFound;

export function useGroupScreen(groupId: EntityId): UseGroupScreenReturn {
    const {
        global,
        removeMemberFromGroup,
        addSettlement: storeAddSettlement,
        deleteExpense: storeDeleteExpense,
        deleteSettlement: storeDeleteSettlement,
    } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddSettlementOpen, setIsAddSettlementOpen] = useState(false);

    if (!group) {
        return { group: null };
    }

    const balances = computeBalances(group);
    const members: MemberRow[] = group.memberIds.map((id) => {
        const user = users.find((u) => u.id === id);
        const balance = balances.find((b) => b.memberId === id);
        return {
            id,
            name: user?.name ?? `User ${id}`,
            amount: balance?.amount ?? 0,
        };
    });

    const nonMembers = users.filter((u) => !group.memberIds.includes(u.id));
    const canAddMember = nonMembers.length > 0;
    const directDebts = computeDirectDebts(group);

    return {
        group,
        users,
        members,
        memberCount: group.memberIds.length,
        canAddMember,
        directDebts,
        isAddMemberOpen,
        isAddExpenseOpen,
        isAddSettlementOpen,
        openAddMember: () => setIsAddMemberOpen(true),
        closeAddMember: () => setIsAddMemberOpen(false),
        openAddExpense: () => setIsAddExpenseOpen(true),
        closeAddExpense: () => setIsAddExpenseOpen(false),
        openAddSettlement: () => setIsAddSettlementOpen(true),
        closeAddSettlement: () => setIsAddSettlementOpen(false),
        removeMember: (id: EntityId) => removeMemberFromGroup(groupId, id),
        addSettlement: (settlement: Omit<Settlement, "id">) =>
            storeAddSettlement(groupId, settlement),
        deleteExpense: (expenseId: EntityId) =>
            storeDeleteExpense(groupId, expenseId),
        deleteSettlement: (settlementId: EntityId) =>
            storeDeleteSettlement(groupId, settlementId),
    };
}
