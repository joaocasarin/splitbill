import * as balanceDomain from "@domain/balance";
import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GroupScreen } from "./GroupScreen";
import type { MemberRow } from "./MembersSection";

let capturedMembers: MemberRow[] = [];

vi.mock("./MembersSection", () => ({
    MembersSection: ({
        members,
        canAddMember,
        onAddMember,
        onRemoveMember,
    }: {
        members: MemberRow[];
        canAddMember: boolean;
        onAddMember: () => void;
        onRemoveMember: (id: number) => void;
    }) => {
        capturedMembers = members;
        return (
            <>
                <button
                    type="button"
                    disabled={!canAddMember}
                    onClick={onAddMember}
                >
                    Add member
                </button>
                {members.map((m) => (
                    <div key={m.id}>
                        <span>{m.name}</span>
                        <button
                            type="button"
                            onClick={() => onRemoveMember(m.id)}
                        >
                            Remove {m.name}
                        </button>
                    </div>
                ))}
            </>
        );
    },
}));

vi.mock("./ExpensesSection", () => ({
    ExpensesSection: ({ onAddExpense }: { onAddExpense: () => void }) => (
        <button type="button" onClick={onAddExpense}>
            Add expense
        </button>
    ),
}));

vi.mock("./SettlementsSection", () => ({
    SettlementsSection: () => <div data-testid="settlements-section" />,
}));

beforeEach(() => {
    setupStoreOnly();
    capturedMembers = [];
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

        test("calls removeMemberFromGroup when onRemoveMember is invoked", async () => {
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

    describe("fallback display", () => {
        test("passes User {id} name when member has no matching user", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            useAppStore.getState().addMemberToGroup(1, 999);
            const group = useAppStore.getState().global.groups[0];
            renderScreen(group.id);
            expect(screen.getByText("User 999")).toBeInTheDocument();
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("passes amount 0 when computeBalances returns no entry for member", () => {
                vi.spyOn(balanceDomain, "computeBalances").mockReturnValueOnce(
                    [],
                );
                const group = setupGroup();
                renderScreen(group.id);
                expect(capturedMembers.every((m) => m.amount === 0)).toBe(true);
            });
        });
    });
});
