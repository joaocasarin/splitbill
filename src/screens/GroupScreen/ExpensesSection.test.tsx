import type { EqualExpense } from "@domain/expense";
import type { User } from "@domain/user";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ExpensesSection } from "./ExpensesSection";

const users: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
];

const expense: EqualExpense = {
    id: 1,
    title: "Hotel",
    total: 10000,
    payerId: 1,
    splitMode: "equal",
    memberIds: [1, 2],
};

describe("ExpensesSection", () => {
    describe("initial state", () => {
        test("renders Expenses heading", () => {
            render(
                <ExpensesSection
                    expenses={[]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText("Expenses")).toBeInTheDocument();
        });

        test("renders Add expense button", () => {
            render(
                <ExpensesSection
                    expenses={[]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("button", { name: /add expense/i }),
            ).toBeInTheDocument();
        });

        test("shows empty state when expenses list is empty", () => {
            render(
                <ExpensesSection
                    expenses={[]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
        });

        test("does not show empty state when expenses exist", () => {
            render(
                <ExpensesSection
                    expenses={[expense]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(
                screen.queryByText(/no expenses yet/i),
            ).not.toBeInTheDocument();
        });
    });

    describe("expense list", () => {
        test("renders expense title", () => {
            render(
                <ExpensesSection
                    expenses={[expense]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText("Hotel")).toBeInTheDocument();
        });

        test("renders formatted expense total", () => {
            render(
                <ExpensesSection
                    expenses={[expense]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText(/100/)).toBeInTheDocument();
        });

        test("renders payer name and split mode", () => {
            render(
                <ExpensesSection
                    expenses={[expense]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText(/paid by alice/i)).toBeInTheDocument();
            expect(screen.getByText(/equal/)).toBeInTheDocument();
        });

        test("renders multiple expenses", () => {
            const expense2 = { ...expense, id: 2, title: "Dinner" };
            render(
                <ExpensesSection
                    expenses={[expense, expense2]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText("Hotel")).toBeInTheDocument();
            expect(screen.getByText("Dinner")).toBeInTheDocument();
        });
    });

    describe("onAddExpense", () => {
        test("calls onAddExpense when Add expense button is clicked", async () => {
            const onAddExpense = vi.fn();
            render(
                <ExpensesSection
                    expenses={[]}
                    users={users}
                    onAddExpense={onAddExpense}
                />,
            );
            await userEvent.click(
                screen.getByRole("button", { name: /add expense/i }),
            );
            expect(onAddExpense).toHaveBeenCalledOnce();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to User {id} when payer has no matching user", () => {
            render(
                <ExpensesSection
                    expenses={[{ ...expense, payerId: 999 }]}
                    users={users}
                    onAddExpense={vi.fn()}
                />,
            );
            expect(screen.getByText(/paid by user 999/i)).toBeInTheDocument();
        });
    });
});
