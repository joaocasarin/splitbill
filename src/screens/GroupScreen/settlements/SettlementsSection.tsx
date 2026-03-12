import { ConfirmDeleteDialog } from "@components/ConfirmDeleteDialog";
import { Button } from "@components/ui/button";
import type { EntityId } from "@domain/common";
import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { formatCurrency } from "@lib/format";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
    settlements: Settlement[];
    users: User[];
    onAddSettlement: () => void;
    onEditSettlement: (settlement: Settlement) => void;
    onDeleteSettlement: (settlementId: EntityId) => void;
};

export function SettlementsSection({
    settlements,
    users,
    onAddSettlement,
    onEditSettlement,
    onDeleteSettlement,
}: Props) {
    const [deletingId, setDeletingId] = useState<EntityId | null>(null);

    function confirmDelete(id: EntityId) {
        onDeleteSettlement(id);
        setDeletingId(null);
    }

    function cancelDelete() {
        setDeletingId(null);
    }

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
                                <button
                                    type="button"
                                    className="flex-1 text-left cursor-pointer"
                                    onClick={() => onEditSettlement(settlement)}
                                    aria-label={`Edit settlement ${fromName} to ${toName}`}
                                >
                                    {fromName} → {toName}
                                </button>
                                <div className="flex items-center gap-2">
                                    <span>
                                        {formatCurrency(settlement.amount)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() =>
                                            setDeletingId(settlement.id)
                                        }
                                        aria-label={`Delete settlement ${fromName} to ${toName}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {deletingId !== null && (
                <ConfirmDeleteDialog
                    open
                    title="Delete settlement"
                    description="This will permanently remove this settlement and recalculate all balances."
                    onConfirm={() => confirmDelete(deletingId)}
                    onClose={cancelDelete}
                />
            )}
        </section>
    );
}
