import { ConfirmDeleteDialog } from "@components/ConfirmDeleteDialog";
import { Button } from "@components/ui/button";
import type { EntityId } from "@domain/common";
import type { Expense } from "@domain/expense";
import type { User } from "@domain/user";
import { formatCurrency } from "@lib/format";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
    expenses: Expense[];
    users: User[];
    onAddExpense: () => void;
    onDeleteExpense: (expenseId: EntityId) => void;
};

export function ExpensesSection({
    expenses,
    users,
    onAddExpense,
    onDeleteExpense,
}: Props) {
    const [deletingId, setDeletingId] = useState<EntityId | null>(null);

    function confirmDelete(id: EntityId) {
        onDeleteExpense(id);
        setDeletingId(null);
    }

    function cancelDelete() {
        setDeletingId(null);
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Expenses
                </h2>
                <Button size="sm" variant="outline" onClick={onAddExpense}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add expense
                </Button>
            </div>
            {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                    No expenses yet.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {expenses.map((expense) => {
                        const payerName =
                            users.find((u) => u.id === expense.payerId)?.name ??
                            `User ${expense.payerId}`;
                        return (
                            <li
                                key={expense.id}
                                className="rounded-lg border border-border px-4 py-3 text-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                        {expense.title}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span>
                                            {formatCurrency(expense.total)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() =>
                                                setDeletingId(expense.id)
                                            }
                                            aria-label={`Delete ${expense.title}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-xs mt-0.5">
                                    Paid by {payerName} · {expense.splitMode}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}

            {deletingId !== null && (
                <ConfirmDeleteDialog
                    open
                    title="Delete expense"
                    description="This will permanently remove this expense and recalculate all balances."
                    onConfirm={() => confirmDelete(deletingId)}
                    onClose={cancelDelete}
                />
            )}
        </section>
    );
}
