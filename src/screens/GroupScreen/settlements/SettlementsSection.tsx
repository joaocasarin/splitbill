import { ConfirmDeleteDialog } from "@components/ConfirmDeleteDialog";
import { Button } from "@components/ui/button";
import type { EntityId } from "@domain/common";
import type { Settlement } from "@domain/settlement";
import { formatCurrency, formatTimestamp } from "@lib/format";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
    settlements: Settlement[];
    members: { id: EntityId; name: string }[];
    onAddSettlement: () => void;
    onEditSettlement: (settlement: Settlement) => void;
    onDeleteSettlement: (settlementId: EntityId) => void;
};

export function SettlementsSection({
    settlements,
    members,
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
                    {settlements
                        .sort(
                            (a, b) =>
                                (b.updatedAt ?? b.createdAt) -
                                (a.updatedAt ?? a.createdAt),
                        )
                        .map((settlement) => {
                            const fromName =
                                members.find(
                                    (m) => m.id === settlement.fromMemberId,
                                )?.name ?? `User ${settlement.fromMemberId}`;
                            const toName =
                                members.find(
                                    (m) => m.id === settlement.toMemberId,
                                )?.name ?? `User ${settlement.toMemberId}`;
                            return (
                                <li
                                    key={settlement.id}
                                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                                >
                                    <button
                                        type="button"
                                        className="flex-1 text-left cursor-pointer"
                                        onClick={() =>
                                            onEditSettlement(settlement)
                                        }
                                        aria-label={`Edit settlement ${fromName} to ${toName}`}
                                    >
                                        <span>
                                            {fromName} → {toName}
                                        </span>
                                        <p className="text-muted-foreground text-xs mt-0.5">
                                            {formatTimestamp(
                                                settlement.updatedAt ??
                                                    settlement.createdAt,
                                            )}
                                        </p>
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
