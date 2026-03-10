import type { Group } from "@domain/group";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { GroupsSection } from "./GroupsSection";

const groups: Group[] = [
    {
        id: 1,
        name: "Trip",
        memberIds: [1, 2],
        expenses: [],
        settlements: [],
    },
    {
        id: 2,
        name: "Dinner",
        memberIds: [1, 2, 3],
        expenses: [],
        settlements: [],
    },
];

type Props = Parameters<typeof GroupsSection>[0];

const defaultProps: Props = {
    groups,
    view: { screen: "home" },
    canCreateGroup: true,
    onAddGroup: vi.fn(),
    onNavigate: vi.fn(),
};

function renderSection(overrides: Partial<Props> = {}) {
    return render(<GroupsSection {...defaultProps} {...overrides} />);
}

describe("GroupsSection", () => {
    describe("initial state", () => {
        test("renders Groups heading", () => {
            renderSection();
            expect(screen.getByText("Groups")).toBeInTheDocument();
        });

        test("renders Add group button", () => {
            renderSection();
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeInTheDocument();
        });
    });

    describe("empty state", () => {
        test("shows prompt to create group when canCreateGroup is true", () => {
            renderSection({ groups: [], canCreateGroup: true });
            expect(screen.getByText(/now create a group/i)).toBeInTheDocument();
        });

        test("shows prompt to add users when canCreateGroup is false", () => {
            renderSection({ groups: [], canCreateGroup: false });
            expect(
                screen.getByText(/add at least two users to unlock/i),
            ).toBeInTheDocument();
        });

        test("does not show empty state when groups exist", () => {
            renderSection();
            expect(
                screen.queryByText(/now create a group/i),
            ).not.toBeInTheDocument();
        });
    });

    describe("canAddGroup", () => {
        test("Add group button is disabled when canCreateGroup is false", () => {
            renderSection({ canCreateGroup: false });
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeDisabled();
        });

        test("Add group button is enabled when canCreateGroup is true", () => {
            renderSection({ canCreateGroup: true });
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeEnabled();
        });
    });

    describe("group list", () => {
        test("renders group names", () => {
            renderSection();
            expect(screen.getByText("Trip")).toBeInTheDocument();
            expect(screen.getByText("Dinner")).toBeInTheDocument();
        });

        test("shows member count for each group", () => {
            renderSection();
            expect(screen.getByText("2 members")).toBeInTheDocument();
            expect(screen.getByText("3 members")).toBeInTheDocument();
        });

        test("marks active group with aria-current", () => {
            renderSection({ view: { screen: "group", groupId: 1 } });
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).toHaveAttribute("aria-current", "page");
        });

        test("does not mark inactive group with aria-current", () => {
            renderSection({ view: { screen: "home" } });
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).not.toHaveAttribute("aria-current");
        });

        test("does not mark group with aria-current when a different group is active", () => {
            renderSection({ view: { screen: "group", groupId: 999 } });
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).not.toHaveAttribute("aria-current");
        });
    });

    describe("onAddGroup", () => {
        test("calls onAddGroup when Add group is clicked", async () => {
            const onAddGroup = vi.fn();
            renderSection({ onAddGroup });
            await userEvent.click(
                screen.getByRole("button", { name: /add group/i }),
            );
            expect(onAddGroup).toHaveBeenCalledOnce();
        });
    });

    describe("onNavigate", () => {
        test("calls onNavigate with correct groupId when group is clicked", async () => {
            const onNavigate = vi.fn();
            renderSection({ onNavigate });
            await userEvent.click(
                screen.getByRole("button", { name: /trip/i }),
            );
            expect(onNavigate).toHaveBeenCalledWith({
                screen: "group",
                groupId: 1,
            });
        });
    });

    describe("onClose", () => {
        test("calls onClose when a group is clicked", async () => {
            const onClose = vi.fn();
            renderSection({ onClose });
            await userEvent.click(
                screen.getByRole("button", { name: /trip/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not throw when onClose is not provided", async () => {
            renderSection({ onClose: undefined });
            await expect(
                userEvent.click(screen.getByRole("button", { name: /trip/i })),
            ).resolves.not.toThrow();
        });
    });
});
