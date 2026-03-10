import { computeBalances } from "@domain/balance";
import type { EntityId } from "@domain/common";
import type { Group } from "@domain/group";
import type { User } from "@domain/user";
import { useAppStore } from "@store";
import { useState } from "react";
import type { MemberRow } from "./MembersSection";

type GroupNotFound = { group: null };

type GroupFound = {
    group: Group;
    users: User[];
    members: MemberRow[];
    memberCount: number;
    canAddMember: boolean;
    isAddMemberOpen: boolean;
    isAddExpenseOpen: boolean;
    openAddMember: () => void;
    closeAddMember: () => void;
    openAddExpense: () => void;
    closeAddExpense: () => void;
    removeMember: (id: EntityId) => void;
};

export type UseGroupScreenReturn = GroupNotFound | GroupFound;

export function useGroupScreen(groupId: EntityId): UseGroupScreenReturn {
    const { global, removeMemberFromGroup } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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

    return {
        group,
        users,
        members,
        memberCount: group.memberIds.length,
        canAddMember,
        isAddMemberOpen,
        isAddExpenseOpen,
        openAddMember: () => setIsAddMemberOpen(true),
        closeAddMember: () => setIsAddMemberOpen(false),
        openAddExpense: () => setIsAddExpenseOpen(true),
        closeAddExpense: () => setIsAddExpenseOpen(false),
        removeMember: (id: EntityId) => removeMemberFromGroup(groupId, id),
    };
}
