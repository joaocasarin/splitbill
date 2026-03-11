import { Button } from "@components/ui/button";
import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { formatCurrency } from "@lib/format";
import { Plus } from "lucide-react";

type Props = {
    settlements: Settlement[];
    users: User[];
    onAddSettlement: () => void;
};

export function SettlementsSection({ settlements, users, onAddSettlement }: Props) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Settlements
                </h2>
                <Button size="sm" variant="outline" onClick={onAddSettlement}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add settlement
                </Button>
            </div>
            {settlements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                    No settlements yet.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {settlements.map((settlement) => {
                        const fromName =
                            users.find((u) => u.id === settlement.fromMemberId)
                                ?.name ?? `User ${settlement.fromMemberId}`;
                        const toName =
                            users.find((u) => u.id === settlement.toMemberId)
                                ?.name ?? `User ${settlement.toMemberId}`;
                        return (
                            <li
                                key={settlement.id}
                                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                            >
                                <span>
                                    {fromName} → {toName}
                                </span>
                                <span>{formatCurrency(settlement.amount)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
