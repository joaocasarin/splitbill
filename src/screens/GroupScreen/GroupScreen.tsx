import type { AppView } from "@app";
import { Button } from "@components/ui/button";
import { computeBalances } from "@domain/balance";
import { type EntityId } from "@domain/common";
import { useAppStore } from "@store";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AddExpenseModal } from "./AddExpenseModal";
import { AddMemberModal } from "./AddMemberModal";
import { ExpensesSection } from "./ExpensesSection";
import { MembersSection } from "./MembersSection";
import { SettlementsSection } from "./SettlementsSection";

type Props = {
    groupId: EntityId;
    onNavigate: (view: AppView) => void;
};

export function GroupScreen({ groupId, onNavigate }: Props) {
    const { global, removeMemberFromGroup } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

    if (!group) {
        return (
            <div className="flex items-center justify-center h-full min-h-80">
                <p className="text-muted-foreground text-sm">
                    Group not found.
                </p>
            </div>
        );
    }

    const balances = computeBalances(group);
    const members = group.memberIds.map((id) => {
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

    return (
        <div className="px-6 py-8 flex flex-col gap-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onNavigate({ screen: "home" })}
                    aria-label="Back"
                >
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                    {group.name}
                </h1>
            </div>

            <MembersSection
                members={members}
                memberCount={group.memberIds.length}
                canAddMember={canAddMember}
                onAddMember={() => setIsAddMemberOpen(true)}
                onRemoveMember={(id) => removeMemberFromGroup(groupId, id)}
            />

            <ExpensesSection
                expenses={group.expenses}
                users={users}
                onAddExpense={() => setIsAddExpenseOpen(true)}
            />

            <SettlementsSection settlements={group.settlements} users={users} />

            <AddMemberModal
                groupId={groupId}
                open={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
            />

            <AddExpenseModal
                groupId={groupId}
                open={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
            />
        </div>
    );
}
