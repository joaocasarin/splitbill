import type { AppView } from "@app";
import { Button } from "@components/ui/button";
import { computeBalances } from "@domain/balance";
import { type EntityId, GROUP_MEMBERS_MIN } from "@domain/common";
import { formatCurrency } from "@lib/format";
import { useAppStore } from "@store";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { AddMemberModal } from "./AddMemberModal";

type Props = {
    groupId: EntityId;
    onNavigate: (view: AppView) => void;
};

export function GroupScreen({ groupId, onNavigate }: Props) {
    const { global, removeMemberFromGroup } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

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

            {/* Members */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Members
                    </h2>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canAddMember}
                        onClick={() => setIsAddMemberOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add member
                    </Button>
                </div>
                <ul className="flex flex-col gap-2">
                    {members.map((member) => {
                        const canRemove =
                            member.amount === 0 &&
                            group.memberIds.length > GROUP_MEMBERS_MIN;
                        return (
                            <li
                                key={member.id}
                                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                        {member.name[0].toUpperCase()}
                                    </span>
                                    <span>{member.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={
                                            member.amount > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : member.amount < 0
                                                  ? "text-red-500"
                                                  : "text-muted-foreground"
                                        }
                                    >
                                        {formatCurrency(member.amount)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={!canRemove}
                                        aria-label={`Remove ${member.name}`}
                                        onClick={() =>
                                            removeMemberFromGroup(
                                                groupId,
                                                member.id,
                                            )
                                        }
                                    >
                                        <X />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* Expenses */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Expenses
                    </h2>
                    <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add expense
                    </Button>
                </div>
                {group.expenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        No expenses yet.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {group.expenses.map((expense) => {
                            const payerName =
                                users.find((u) => u.id === expense.payerId)
                                    ?.name ?? `User ${expense.payerId}`;
                            return (
                                <li
                                    key={expense.id}
                                    className="rounded-lg border border-border px-4 py-3 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            {expense.title}
                                        </span>
                                        <span>
                                            {formatCurrency(expense.total)}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs mt-0.5">
                                        Paid by {payerName} ·{" "}
                                        {expense.splitMode}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Settlements */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Settlements
                    </h2>
                    <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add settlement
                    </Button>
                </div>
                {group.settlements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        No settlements yet.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {group.settlements.map((settlement) => {
                            const fromName =
                                users.find(
                                    (u) => u.id === settlement.fromMemberId,
                                )?.name ?? `User ${settlement.fromMemberId}`;
                            const toName =
                                users.find(
                                    (u) => u.id === settlement.toMemberId,
                                )?.name ?? `User ${settlement.toMemberId}`;
                            return (
                                <li
                                    key={settlement.id}
                                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                                >
                                    <span>
                                        {fromName} → {toName}
                                    </span>
                                    <span>
                                        {formatCurrency(settlement.amount)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <AddMemberModal
                groupId={groupId}
                open={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
            />
        </div>
    );
}
