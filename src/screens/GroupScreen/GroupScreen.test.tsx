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
    SettlementsSection: () => <div data-testid="settlements-section" />,
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

vi.mock("./expenses/AddExpenseModal", () => ({
    AddExpenseModal: ({
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
        members: testUsers.map((u) => ({ ...u, amount: 0 })),
        memberCount: 2,
        canAddMember: false,
        isAddMemberOpen: false,
        isAddExpenseOpen: false,
        openAddMember: vi.fn(),
        closeAddMember: vi.fn(),
        openAddExpense: vi.fn(),
        closeAddExpense: vi.fn(),
        removeMember: vi.fn(),
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

        test("renders AddExpenseModal when isAddExpenseOpen is true", () => {
            renderScreen(makeHookReturn({ isAddExpenseOpen: true }));
            expect(screen.getByRole("dialog")).toBeInTheDocument();
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
});
