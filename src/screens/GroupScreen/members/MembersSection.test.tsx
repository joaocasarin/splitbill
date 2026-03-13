import { GROUP_MEMBERS_MIN } from "@domain/common";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import type { MemberRow } from "./MembersSection";
import { MembersSection } from "./MembersSection";

const members: MemberRow[] = [
    { id: 1, name: "Alice", amount: 10000, owes: [], receives: [] },
    { id: 2, name: "Bob", amount: -10000, owes: [], receives: [] },
];

function renderSection(
    overrides: Partial<{
        members: MemberRow[];
        memberCount: number;
        canAddMember: boolean;
        onAddMember: () => void;
        onRemoveMember: (id: number) => void;
    }> = {},
) {
    return render(
        <MembersSection
            members={members}
            memberCount={members.length}
            canAddMember={false}
            onAddMember={vi.fn()}
            onRemoveMember={vi.fn()}
            {...overrides}
        />,
    );
}

describe("MembersSection", () => {
    describe("initial state", () => {
        test("renders Members heading", () => {
            renderSection();
            expect(screen.getByText("Members")).toBeInTheDocument();
        });

        test("renders Add member button", () => {
            renderSection();
            expect(
                screen.getByRole("button", { name: /add member/i }),
            ).toBeInTheDocument();
        });

        test("renders all member names", () => {
            renderSection();
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Bob")).toBeInTheDocument();
        });
    });

    describe("member balances", () => {
        test("renders formatted balance for each member", () => {
            renderSection();
            expect(
                screen.getAllByText(/R\$\s*100,00/).length,
            ).toBeGreaterThanOrEqual(1);
            expect(screen.getByText(/-R\$\s*100,00/)).toBeInTheDocument();
        });

        test("renders avatar initial in uppercase", () => {
            renderSection();
            expect(screen.getByText("A")).toBeInTheDocument();
            expect(screen.getByText("B")).toBeInTheDocument();
        });
    });

    describe("canAddMember", () => {
        test("Add member button is disabled when canAddMember is false", () => {
            renderSection({ canAddMember: false });
            expect(
                screen.getByRole("button", { name: /add member/i }),
            ).toBeDisabled();
        });

        test("Add member button is enabled when canAddMember is true", () => {
            renderSection({ canAddMember: true });
            expect(
                screen.getByRole("button", { name: /add member/i }),
            ).toBeEnabled();
        });

        test("calls onAddMember when Add member is clicked", async () => {
            const onAddMember = vi.fn();
            renderSection({ canAddMember: true, onAddMember });
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            expect(onAddMember).toHaveBeenCalledOnce();
        });
    });

    describe("remove member", () => {
        test("remove button is disabled when member has non-zero balance", () => {
            renderSection({
                memberCount: GROUP_MEMBERS_MIN + 1,
            });
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeDisabled();
            expect(
                screen.getByRole("button", { name: /remove bob/i }),
            ).toBeDisabled();
        });

        test("remove button is disabled when memberCount equals GROUP_MEMBERS_MIN", () => {
            renderSection({
                members: [
                    { id: 1, name: "Alice", amount: 0, owes: [], receives: [] },
                    { id: 2, name: "Bob", amount: 0, owes: [], receives: [] },
                ],
                memberCount: GROUP_MEMBERS_MIN,
            });
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeDisabled();
            expect(
                screen.getByRole("button", { name: /remove bob/i }),
            ).toBeDisabled();
        });

        test("remove button is enabled for member with zero balance when memberCount exceeds GROUP_MEMBERS_MIN", () => {
            renderSection({
                members: [
                    { id: 1, name: "Alice", amount: 0, owes: [], receives: [] },
                    {
                        id: 2,
                        name: "Bob",
                        amount: -10000,
                        owes: [],
                        receives: [],
                    },
                    {
                        id: 3,
                        name: "Carol",
                        amount: 10000,
                        owes: [],
                        receives: [],
                    },
                ],
                memberCount: GROUP_MEMBERS_MIN + 1,
            });
            expect(
                screen.getByRole("button", { name: /remove alice/i }),
            ).toBeEnabled();
            expect(
                screen.getByRole("button", { name: /remove bob/i }),
            ).toBeDisabled();
        });

        test("calls onRemoveMember with member id when remove is clicked", async () => {
            const onRemoveMember = vi.fn();
            renderSection({
                members: [
                    { id: 1, name: "Alice", amount: 0, owes: [], receives: [] },
                    { id: 2, name: "Bob", amount: 0, owes: [], receives: [] },
                    { id: 3, name: "Carol", amount: 0, owes: [], receives: [] },
                ],
                memberCount: GROUP_MEMBERS_MIN + 1,
                onRemoveMember,
            });
            await userEvent.click(
                screen.getByRole("button", { name: /remove alice/i }),
            );
            expect(onRemoveMember).toHaveBeenCalledWith(1);
        });
    });

    describe("debt details", () => {
        test("renders owes details under member with debts", () => {
            renderSection({
                members: [
                    {
                        id: 1,
                        name: "Alice",
                        amount: -5000,
                        owes: [{ name: "Bob", amount: 5000 }],
                        receives: [],
                    },
                    {
                        id: 2,
                        name: "Bob",
                        amount: 5000,
                        owes: [],
                        receives: [{ name: "Alice", amount: 5000 }],
                    },
                ],
            });
            expect(screen.getByText(/owes/)).toBeInTheDocument();
            expect(screen.getByText(/to Bob/)).toBeInTheDocument();
        });

        test("renders multiple owes lines", () => {
            renderSection({
                members: [
                    {
                        id: 1,
                        name: "Alice",
                        amount: -10000,
                        owes: [
                            { name: "Bob", amount: 5000 },
                            { name: "Carol", amount: 5000 },
                        ],
                        receives: [],
                    },
                ],
            });
            expect(screen.getByText(/to Bob/)).toBeInTheDocument();
            expect(screen.getByText(/to Carol/)).toBeInTheDocument();
        });

        test("renders receives details under member with credits", () => {
            renderSection({
                members: [
                    {
                        id: 1,
                        name: "Alice",
                        amount: 5000,
                        owes: [],
                        receives: [{ name: "Bob", amount: 5000 }],
                    },
                ],
            });
            expect(screen.getByText(/receives/)).toBeInTheDocument();
            expect(screen.getByText(/from Bob/)).toBeInTheDocument();
        });

        test("does not render debt details when owes and receives are empty", () => {
            renderSection({
                members: [
                    { id: 1, name: "Alice", amount: 0, owes: [], receives: [] },
                ],
            });
            expect(screen.queryByText(/owes/)).not.toBeInTheDocument();
            expect(screen.queryByText(/receives/)).not.toBeInTheDocument();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("shows User fallback name initial when name starts with any character", () => {
            renderSection({
                members: [
                    {
                        id: 999,
                        name: "User 999",
                        amount: 0,
                        owes: [],
                        receives: [],
                    },
                ],
            });
            expect(screen.getByText("U")).toBeInTheDocument();
        });
    });
});
