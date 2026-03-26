import type { EqualExpense, Expense } from "@domain/expense";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testMembers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import type { MemberRow } from "../members/MembersSection";
import { ExpensesSection } from "./ExpensesSection";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

const members: MemberRow[] = testMembers.map((m) => ({
    ...m,
    amount: 0,
    owes: [],
    receives: [],
}));

const expense: EqualExpense = {
    id: 1,
    title: "Hotel",
    total: 10000,
    payerId: 1,
    splitMode: "equal",
    memberIds: [1, 2],
    createdAt: 1000000,
};

function renderSection(
    expenses: EqualExpense[] = [],
    overrides: {
        onAddExpense?: () => void;
        onEditExpense?: (expense: Expense) => void;
        onDeleteExpense?: (id: number) => void;
    } = {},
) {
    const onAddExpense = overrides.onAddExpense ?? vi.fn();
    const onEditExpense = overrides.onEditExpense ?? vi.fn();
    const onDeleteExpense = overrides.onDeleteExpense ?? vi.fn();
    return {
        onAddExpense,
        onEditExpense,
        onDeleteExpense,
        ...render(
            <ExpensesSection
                expenses={expenses}
                members={members}
                onAddExpense={onAddExpense}
                onEditExpense={onEditExpense}
                onDeleteExpense={onDeleteExpense}
            />,
        ),
    };
}

describe("ExpensesSection", () => {
    describe("initial state", () => {
        test("renders Expenses heading", () => {
            renderSection();
            expect(screen.getByText("Expenses")).toBeInTheDocument();
        });

        test("renders Add expense button", () => {
            renderSection();
            expect(
                screen.getByRole("button", { name: /add expense/i }),
            ).toBeInTheDocument();
        });

        test("shows empty state when expenses list is empty", () => {
            renderSection();
            expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
        });

        test("does not show empty state when expenses exist", () => {
            renderSection([expense]);
            expect(
                screen.queryByText(/no expenses yet/i),
            ).not.toBeInTheDocument();
        });
    });

    describe("expense list", () => {
        test("renders expense title", () => {
            renderSection([expense]);
            expect(screen.getByText("Hotel")).toBeInTheDocument();
        });

        test("renders formatted expense total", () => {
            renderSection([expense]);
            expect(screen.getByText(/100/)).toBeInTheDocument();
        });

        test("renders payer name and split mode", () => {
            renderSection([expense]);
            expect(screen.getByText(/paid by alice/i)).toBeInTheDocument();
            expect(screen.getByText(/equal/)).toBeInTheDocument();
        });

        test("renders multiple expenses", () => {
            const expense2 = { ...expense, id: 2, title: "Dinner" };
            renderSection([expense, expense2]);
            expect(screen.getByText("Hotel")).toBeInTheDocument();
            expect(screen.getByText("Dinner")).toBeInTheDocument();
        });

        test("renders timestamp on expense item", () => {
            renderSection([expense]);
            expect(
                screen.getByText(/\d{2}:\d{2} \d{2}\/\d{2}\/\d{2}/),
            ).toBeInTheDocument();
        });

        test("sorts expenses by createdAt descending", () => {
            const older = {
                ...expense,
                id: 1,
                title: "Older",
                createdAt: 1000,
            };
            const newer = {
                ...expense,
                id: 2,
                title: "Newer",
                createdAt: 2000,
            };
            renderSection([older, newer]);
            const items = screen.getAllByRole("listitem");
            expect(items[0]).toHaveTextContent("Newer");
            expect(items[1]).toHaveTextContent("Older");
        });

        test("uses updatedAt over createdAt for sorting when present", () => {
            const e1 = {
                ...expense,
                id: 1,
                title: "Created Later",
                createdAt: 2000,
            };
            const e2 = {
                ...expense,
                id: 2,
                title: "Updated Later",
                createdAt: 1000,
                updatedAt: 3000,
            };
            renderSection([e1, e2]);
            const items = screen.getAllByRole("listitem");
            expect(items[0]).toHaveTextContent("Updated Later");
            expect(items[1]).toHaveTextContent("Created Later");
        });

        test("renders delete button for each expense", () => {
            renderSection([expense]);
            expect(
                screen.getByRole("button", { name: /delete hotel/i }),
            ).toBeInTheDocument();
        });

        test("resolves payer name for a soft-deleted member included in members list", () => {
            const allMembers = [...members, { id: 3, name: "Carol" }];
            render(
                <ExpensesSection
                    expenses={[{ ...expense, id: 2, payerId: 3 }]}
                    members={allMembers}
                    onAddExpense={vi.fn()}
                    onEditExpense={vi.fn()}
                    onDeleteExpense={vi.fn()}
                />,
            );
            expect(screen.getByText(/paid by carol/i)).toBeInTheDocument();
        });
    });

    describe("onAddExpense", () => {
        test("calls onAddExpense when Add expense button is clicked", async () => {
            const onAddExpense = vi.fn();
            renderSection([], { onAddExpense });
            await userEvent.click(
                screen.getByRole("button", { name: /add expense/i }),
            );
            expect(onAddExpense).toHaveBeenCalledOnce();
        });
    });

    describe("editing", () => {
        test("clicking expense item calls onEditExpense with the expense", async () => {
            const onEditExpense = vi.fn();
            renderSection([expense], { onEditExpense });
            await userEvent.click(
                screen.getByRole("button", { name: /edit hotel/i }),
            );
            expect(onEditExpense).toHaveBeenCalledWith(expense);
        });

        test("renders edit button for each expense", () => {
            renderSection([expense]);
            expect(
                screen.getByRole("button", { name: /edit hotel/i }),
            ).toBeInTheDocument();
        });
    });

    describe("deleting", () => {
        test("clicking delete button opens confirm dialog", async () => {
            renderSection([expense]);
            await userEvent.click(
                screen.getByRole("button", { name: /delete hotel/i }),
            );
            expect(screen.getByText("Delete expense")).toBeInTheDocument();
        });

        test("confirming delete calls onDeleteExpense with expense id", async () => {
            const onDeleteExpense = vi.fn();
            renderSection([expense], { onDeleteExpense });
            await userEvent.click(
                screen.getByRole("button", { name: /delete hotel/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /^delete$/i }),
            );
            expect(onDeleteExpense).toHaveBeenCalledWith(1);
        });

        test("cancelling delete does not call onDeleteExpense", async () => {
            const onDeleteExpense = vi.fn();
            renderSection([expense], { onDeleteExpense });
            await userEvent.click(
                screen.getByRole("button", { name: /delete hotel/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onDeleteExpense).not.toHaveBeenCalled();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to User {id} when payer has no matching member", () => {
            renderSection([{ ...expense, payerId: 999 }]);
            expect(screen.getByText(/paid by user 999/i)).toBeInTheDocument();
        });
    });
});
