import * as balanceDomain from "@domain/balance";
import type { EqualExpense } from "@domain/expense";
import { useAppStore } from "@store";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GroupScreen } from "./GroupScreen";

vi.mock("./ExpensesSection", () => ({
    ExpensesSection: ({ onAddExpense }: { onAddExpense: () => void }) => (
        <button type="button" onClick={onAddExpense}>
            Add expense
        </button>
    ),
}));

beforeEach(() => {
    setupStoreOnly();
});

function setupGroup() {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}

function renderScreen(groupId: number, onNavigate = vi.fn()) {
    return {
        onNavigate,
        ...render(<GroupScreen groupId={groupId} onNavigate={onNavigate} />),
    };
}

describe("GroupScreen", () => {
    describe("group not found", () => {
        test("shows not found message when group does not exist", () => {
            renderScreen(999);
            expect(screen.getByText(/group not found/i)).toBeInTheDocument();
        });
    });

    describe("header", () => {
        test("shows group name", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(
                screen.getByRole("heading", { name: "Trip" }),
            ).toBeInTheDocument();
        });

        test("back button navigates to home", async () => {
            const group = setupGroup();
            const { onNavigate } = renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /back/i }),
            );
            expect(onNavigate).toHaveBeenCalledWith({ screen: "home" });
        });
    });

    describe("members", () => {
        test("shows all group members", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Bob")).toBeInTheDocument();
        });

        test("shows balance R$ 0,00 for each member in empty group", () => {
            const group = setupGroup();
            renderScreen(group.id);
            const zeros = screen.getAllByText(/R\$\s*0,00/);
            expect(zeros).toHaveLength(2);
        });

        test("shows positive balance for payer", () => {
            const group = setupGroup();
            useAppStore.getState().addExpense(group.id, {
                title: "Dinner",
                total: 20000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as unknown as Omit<EqualExpense, "id">);
            renderScreen(group.id);

            const aliceItem = screen.getByText("Alice").closest("li");

            expect(aliceItem).not.toBeNull();
            expect(
                within(aliceItem as HTMLElement).getByText(/100,00/),
            ).toBeInTheDocument();
        });

        test("shows negative balance for debtor", () => {
            const group = setupGroup();
            useAppStore.getState().addExpense(group.id, {
                title: "Dinner",
                total: 20000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as unknown as Omit<EqualExpense, "id">);
            renderScreen(group.id);
            expect(screen.getByText(/-R\$\s*100,00/)).toBeInTheDocument();
        });
    });

    describe("remove member", () => {
        test("remove button is disabled when member has non-zero balance", () => {
            const group = setupGroup();
            useAppStore.getState().addExpense(group.id, {
                title: "Dinner",
                total: 20000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as unknown as Omit<EqualExpense, "id">);
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeDisabled();
            expect(
                screen.getByRole("button", { name: /remove bob/i }),
            ).toBeDisabled();
        });

        test("remove button is disabled when only 2 members remain", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeDisabled();
            expect(
                screen.getByRole("button", { name: /remove bob/i }),
            ).toBeDisabled();
        });

        test("remove button is enabled for member with zero balance when group has 3+ members", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeEnabled();
        });

        test("removes member when remove button is clicked", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /remove alice/i }),
            );
            const updatedGroup = useAppStore.getState().global.groups[0];
            expect(updatedGroup.memberIds).not.toContain(1);
        });
    });

    describe("add member", () => {
        test("Add member button is disabled when no non-members exist", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /add member/i }),
            ).toBeDisabled();
        });

        test("Add member button is enabled when non-members exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /add member/i }),
            ).toBeEnabled();
        });

        test("opens AddMemberModal when Add member is clicked", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddMemberModal when onClose is called", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("expenses", () => {
        test("opens AddExpenseModal when Add expense is clicked", async () => {
            const group = setupGroup();
            renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /add expense/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddExpenseModal when onClose is called", async () => {
            const group = setupGroup();
            renderScreen(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /add expense/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("settlements", () => {
        test("shows empty state when no settlements", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(screen.getByText(/no settlements yet/i)).toBeInTheDocument();
        });

        test("shows settlement from/to names and amount", () => {
            const group = setupGroup();
            useAppStore.getState().addExpense(group.id, {
                title: "Dinner",
                total: 20000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as unknown as Omit<EqualExpense, "id">);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 10000,
            });
            renderScreen(group.id);
            expect(screen.getByText(/bob.*alice/i)).toBeInTheDocument();
            expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument();
        });

        test("Add settlement button is present", () => {
            const group = setupGroup();
            renderScreen(group.id);
            expect(
                screen.getByRole("button", { name: /add settlement/i }),
            ).toBeInTheDocument();
        });
    });

    describe("fallback display", () => {
        test("shows User {id} when member has no matching user", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            useAppStore.getState().addMemberToGroup(1, 999);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            expect(screen.getByText("User 999")).toBeInTheDocument();
        });

        test("shows User {id} as from/to when settlement member has no matching user", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const group = useAppStore.getState().global.groups[0];
            useAppStore.setState((state) => ({
                global: {
                    ...state.global,
                    groups: state.global.groups.map((g) =>
                        g.id === group.id
                            ? {
                                  ...g,
                                  settlements: [
                                      {
                                          id: 1,
                                          fromMemberId: 998,
                                          toMemberId: 999,
                                          amount: 5000,
                                      },
                                  ],
                              }
                            : g,
                    ),
                },
            }));
            renderScreen(group.id);
            expect(screen.getByText("User 998 → User 999")).toBeInTheDocument();
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("shows R$ 0,00 when computeBalances returns no entry for member", () => {
                vi.spyOn(balanceDomain, "computeBalances").mockReturnValueOnce(
                    [],
                );
                const group = setupGroup();
                renderScreen(group.id);
                const zeros = screen.getAllByText(/R\$\s*0,00/);
                expect(zeros.length).toBeGreaterThanOrEqual(2);
            });
        });
    });
});
