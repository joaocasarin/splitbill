import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testUsers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import { GroupScreen } from "./GroupScreen";
import type { UseGroupScreenReturn } from "./useGroupScreen";
import * as useGroupScreenModule from "./useGroupScreen";

vi.mock("./members/MembersSection", () => ({
    MembersSection: ({
        onAddMember,
        onRemoveMember,
    }: {
        onAddMember: () => void;
        onRemoveMember: (id: number) => void;
    }) => (
        <>
            <button type="button" onClick={onAddMember}>
                Add member
            </button>
            <button type="button" onClick={() => onRemoveMember(1)}>
                Remove Alice
            </button>
        </>
    ),
}));

vi.mock("./expenses/ExpensesSection", () => ({
    ExpensesSection: ({ onAddExpense }: { onAddExpense: () => void }) => (
        <button type="button" onClick={onAddExpense}>
            Add expense
        </button>
    ),
}));

vi.mock("./settlements/SettlementsSection", () => ({
    SettlementsSection: ({
        onAddSettlement,
        onEditSettlement,
    }: {
        onAddSettlement: () => void;
        onEditSettlement: (settlement: { id: number }) => void;
    }) => (
        <>
            <button type="button" onClick={onAddSettlement}>
                Add settlement
            </button>
            <button type="button" onClick={() => onEditSettlement({ id: 1 })}>
                Edit settlement
            </button>
        </>
    ),
}));

vi.mock("./settlements/SettlementModal", () => ({
    SettlementModal: ({
        open,
        onClose,
        onSubmit,
    }: {
        open: boolean;
        onClose: () => void;
        onSubmit?: (data: {
            fromMemberId: number;
            toMemberId: number;
            amount: number;
        }) => void;
    }) =>
        open ? (
            <div role="dialog" aria-label="settlement-modal">
                <button type="button" onClick={onClose}>
                    Cancel
                </button>
                {onSubmit && (
                    <button
                        type="button"
                        onClick={() =>
                            onSubmit({
                                fromMemberId: 2,
                                toMemberId: 1,
                                amount: 3000,
                            })
                        }
                    >
                        Submit
                    </button>
                )}
            </div>
        ) : null,
}));

vi.mock("./members/AddMemberModal", () => ({
    AddMemberModal: ({
        open,
        onClose,
    }: {
        open: boolean;
        onClose: () => void;
    }) =>
        open ? (
            <div role="dialog">
                <button type="button" onClick={onClose}>
                    Cancel
                </button>
            </div>
        ) : null,
}));

vi.mock("./expenses/ExpenseModal", () => ({
    ExpenseModal: ({
        open,
        onClose,
    }: {
        open: boolean;
        onClose: () => void;
    }) =>
        open ? (
            <div role="dialog" aria-label="expense-modal">
                <button type="button" onClick={onClose}>
                    Cancel
                </button>
            </div>
        ) : null,
}));

type FoundState = Extract<
    UseGroupScreenReturn,
    { group: NonNullable<UseGroupScreenReturn["group"]> }
>;

function makeHookReturn(overrides: Partial<FoundState> = {}) {
    return {
        group: {
            id: 1,
            name: "Trip",
            memberIds: [1, 2],
            expenses: [],
            settlements: [],
        },
        users: testUsers,
        members: testUsers.map((u) => ({
            ...u,
            amount: 0,
            owes: [],
            receives: [],
        })),
        memberCount: 2,
        canAddMember: false,
        directDebts: [],
        editDirectDebts: [],
        editingExpense: null,
        isAddMemberOpen: false,
        isAddExpenseOpen: false,
        isAddSettlementOpen: false,
        editingSettlement: null,
        openAddMember: vi.fn(),
        closeAddMember: vi.fn(),
        openAddExpense: vi.fn(),
        closeAddExpense: vi.fn(),
        openEditExpense: vi.fn(),
        closeEditExpense: vi.fn(),
        openAddSettlement: vi.fn(),
        closeAddSettlement: vi.fn(),
        openEditSettlement: vi.fn(),
        closeEditSettlement: vi.fn(),
        removeMember: vi.fn(),
        addSettlement: vi.fn(),
        updateSettlement: vi.fn(),
        deleteExpense: vi.fn(),
        deleteSettlement: vi.fn(),
        ...overrides,
    } as unknown as ReturnType<typeof useGroupScreenModule.useGroupScreen>;
}

function renderScreen(
    hookReturn: ReturnType<typeof useGroupScreenModule.useGroupScreen>,
    onNavigate = vi.fn(),
) {
    vi.spyOn(useGroupScreenModule, "useGroupScreen").mockReturnValue(
        hookReturn,
    );
    return {
        onNavigate,
        ...render(<GroupScreen groupId={1} onNavigate={onNavigate} />),
    };
}

describe("GroupScreen", () => {
    describe("group not found", () => {
        test("shows not found message when group is null", () => {
            renderScreen({ group: null } as ReturnType<
                typeof useGroupScreenModule.useGroupScreen
            >);
            expect(screen.getByText(/group not found/i)).toBeInTheDocument();
        });
    });

    describe("header", () => {
        test("shows group name", () => {
            renderScreen(makeHookReturn());
            expect(
                screen.getByRole("heading", { name: "Trip" }),
            ).toBeInTheDocument();
        });

        test("back button navigates to home", async () => {
            const { onNavigate } = renderScreen(makeHookReturn());
            await userEvent.click(
                screen.getByRole("button", { name: /back/i }),
            );
            expect(onNavigate).toHaveBeenCalledWith({ screen: "home" });
        });
    });

    describe("add member modal", () => {
        test("calls openAddMember when Add member is clicked", async () => {
            const openAddMember = vi.fn();
            renderScreen(makeHookReturn({ openAddMember }));
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            expect(openAddMember).toHaveBeenCalledOnce();
        });

        test("renders AddMemberModal when isAddMemberOpen is true", () => {
            renderScreen(makeHookReturn({ isAddMemberOpen: true }));
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("calls closeAddMember when modal cancel is clicked", async () => {
            const closeAddMember = vi.fn();
            renderScreen(
                makeHookReturn({
                    isAddMemberOpen: true,
                    closeAddMember,
                }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(closeAddMember).toHaveBeenCalledOnce();
        });
    });

    describe("remove member", () => {
        test("calls removeMember when onRemoveMember is invoked", async () => {
            const removeMember = vi.fn();
            renderScreen(makeHookReturn({ removeMember }));
            await userEvent.click(
                screen.getByRole("button", { name: /remove alice/i }),
            );
            expect(removeMember).toHaveBeenCalledWith(1);
        });
    });

    describe("add expense modal", () => {
        test("calls openAddExpense when Add expense is clicked", async () => {
            const openAddExpense = vi.fn();
            renderScreen(makeHookReturn({ openAddExpense }));
            await userEvent.click(
                screen.getByRole("button", { name: /add expense/i }),
            );
            expect(openAddExpense).toHaveBeenCalledOnce();
        });

        test("renders ExpenseModal when isAddExpenseOpen is true", () => {
            renderScreen(makeHookReturn({ isAddExpenseOpen: true }));
            expect(
                screen.getByRole("dialog", { name: /expense-modal/i }),
            ).toBeInTheDocument();
        });

        test("calls closeAddExpense when modal cancel is clicked", async () => {
            const closeAddExpense = vi.fn();
            renderScreen(
                makeHookReturn({
                    isAddExpenseOpen: true,
                    closeAddExpense,
                }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(closeAddExpense).toHaveBeenCalledOnce();
        });
    });

    describe("edit expense modal", () => {
        test("renders edit ExpenseModal when editingExpense is set", () => {
            const editingExpense = {
                id: 1,
                title: "Hotel",
                total: 10000,
                payerId: 1,
                splitMode: "equal" as const,
                memberIds: [1, 2],
            };
            renderScreen(makeHookReturn({ editingExpense }));
            const dialogs = screen.getAllByRole("dialog", {
                name: /expense-modal/i,
            });
            expect(dialogs).toHaveLength(1);
        });

        test("does not render edit ExpenseModal when editingExpense is null", () => {
            renderScreen(makeHookReturn({ editingExpense: null }));
            expect(
                screen.queryByRole("dialog", { name: /expense-modal/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("add settlement modal", () => {
        test("calls openAddSettlement when Add settlement is clicked", async () => {
            const openAddSettlement = vi.fn();
            renderScreen(makeHookReturn({ openAddSettlement }));
            await userEvent.click(
                screen.getByRole("button", { name: /add settlement/i }),
            );
            expect(openAddSettlement).toHaveBeenCalledOnce();
        });

        test("renders AddSettlementModal when isAddSettlementOpen is true", () => {
            renderScreen(makeHookReturn({ isAddSettlementOpen: true }));
            expect(
                screen.getByRole("dialog", { name: /settlement-modal/i }),
            ).toBeInTheDocument();
        });

        test("calls closeAddSettlement when modal cancel is clicked", async () => {
            const closeAddSettlement = vi.fn();
            renderScreen(
                makeHookReturn({
                    isAddSettlementOpen: true,
                    closeAddSettlement,
                }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(closeAddSettlement).toHaveBeenCalledOnce();
        });
    });

    describe("edit settlement modal", () => {
        test("calls openEditSettlement when Edit settlement is clicked", async () => {
            const openEditSettlement = vi.fn();
            renderScreen(makeHookReturn({ openEditSettlement }));
            await userEvent.click(
                screen.getByRole("button", { name: /edit settlement/i }),
            );
            expect(openEditSettlement).toHaveBeenCalledOnce();
        });

        test("renders edit SettlementModal when editingSettlement is set", () => {
            const editingSettlement = {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            };
            renderScreen(makeHookReturn({ editingSettlement }));
            const dialogs = screen.getAllByRole("dialog", {
                name: /settlement-modal/i,
            });
            expect(dialogs).toHaveLength(1);
        });

        test("does not render edit SettlementModal when editingSettlement is null", () => {
            renderScreen(makeHookReturn({ editingSettlement: null }));
            expect(
                screen.queryByRole("dialog", { name: /settlement-modal/i }),
            ).not.toBeInTheDocument();
        });

        test("calls updateSettlement with settlement id when edit modal submits", async () => {
            const updateSettlement = vi.fn();
            const editingSettlement = {
                id: 7,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            };
            renderScreen(
                makeHookReturn({ editingSettlement, updateSettlement }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /submit/i }),
            );
            expect(updateSettlement).toHaveBeenCalledWith({
                id: 7,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });
        });
    });
});
