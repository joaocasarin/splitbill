import { Button } from "@components/ui/button";
import type { Expense } from "@domain/expense";
import type { User } from "@domain/user";
import { formatCurrency } from "@lib/format";
import { Plus } from "lucide-react";

type Props = {
    expenses: Expense[];
    users: User[];
    onAddExpense: () => void;
};

export function ExpensesSection({ expenses, users, onAddExpense }: Props) {
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
                                    <span>{formatCurrency(expense.total)}</span>
                                </div>
                                <p className="text-muted-foreground text-xs mt-0.5">
                                    Paid by {payerName} · {expense.splitMode}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
