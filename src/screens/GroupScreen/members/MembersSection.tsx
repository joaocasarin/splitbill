import { Button } from "@components/ui/button";
import { type EntityId, GROUP_MEMBERS_MIN } from "@domain/common";
import { formatCurrency } from "@lib/format";
import { Plus, Shuffle, X } from "lucide-react";

export type DebtDetail = {
    name: string;
    amount: number;
};

export type MemberRow = {
    id: EntityId;
    name: string;
    amount: number;
    owes: DebtDetail[];
    receives: DebtDetail[];
};

type Props = {
    members: MemberRow[];
    memberCount: number;
    canAddMember: boolean;
    isSimplifiedView: boolean;
    onAddMember: () => void;
    onRemoveMember: (id: EntityId) => void;
    onToggleSimplifiedView: () => void;
};

export function MembersSection({
    members,
    memberCount,
    canAddMember,
    isSimplifiedView,
    onAddMember,
    onRemoveMember,
    onToggleSimplifiedView,
}: Props) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Members
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant={isSimplifiedView ? "default" : "outline"}
                        onClick={onToggleSimplifiedView}
                        aria-label="Toggle simplified view"
                        aria-pressed={isSimplifiedView}
                    >
                        <Shuffle className="w-4 h-4 mr-1" />
                        Simplify
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canAddMember}
                        onClick={onAddMember}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add member
                    </Button>
                </div>
            </div>
            <ul className="flex flex-col gap-2">
                {members.map((member) => {
                    const canRemove =
                        member.amount === 0 && memberCount > GROUP_MEMBERS_MIN;
                    return (
                        <li
                            key={member.id}
                            className="flex flex-col rounded-lg border border-border px-4 py-3 text-sm"
                        >
                            <div className="flex items-center justify-between">
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
                                            onRemoveMember(member.id)
                                        }
                                    >
                                        <X />
                                    </Button>
                                </div>
                            </div>
                            {member.owes.length > 0 && (
                                <ul className="ml-10 mt-1 flex flex-col gap-0.5 text-xs text-red-500">
                                    {member.owes.map((debt) => (
                                        <li key={debt.name}>
                                            owes {formatCurrency(debt.amount)}{" "}
                                            to {debt.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {member.receives.length > 0 && (
                                <ul className="ml-10 mt-1 flex flex-col gap-0.5 text-xs text-green-600 dark:text-green-400">
                                    {member.receives.map((credit) => (
                                        <li key={credit.name}>
                                            receives{" "}
                                            {formatCurrency(credit.amount)} from{" "}
                                            {credit.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
