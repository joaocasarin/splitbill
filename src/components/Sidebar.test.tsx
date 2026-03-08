import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Sidebar } from "./Sidebar";

const defaultProps = {
    view: { screen: "home" as const },
    onNavigate: vi.fn(),
};

beforeEach(() => {
    setupStoreOnly();
    vi.clearAllMocks();
});

describe("Sidebar", () => {
    describe("users section", () => {
        test("shows empty state when no users exist", () => {
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByText(/start by adding at least two users/i),
            ).toBeInTheDocument();
        });

        test("renders user names when users exist", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Bob")).toBeInTheDocument();
        });

        test("renders user initial avatar when user exists", () => {
            useAppStore.getState().addUser("Alice");
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText("A")).toBeInTheDocument();
        });

        test("opens AddUsersModal when Add user is clicked", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /add user/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddUsersModal when cancel is clicked", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /add user/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("groups section", () => {
        test("shows empty state prompting to add users when fewer than 2 users exist", () => {
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByText(/add at least two users to unlock/i),
            ).toBeInTheDocument();
        });

        test("shows empty state prompting to create a group when users are sufficient", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText(/now create a group/i)).toBeInTheDocument();
        });

        test("Add group button is disabled when no users exist", () => {
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeDisabled();
        });

        test("Add group button is disabled when fewer than 2 users exist", () => {
            useAppStore.getState().addUser("Alice");
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeDisabled();
        });

        test("Add group button is enabled when 2 or more users exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeEnabled();
        });

        test("opens AddGroupModal when Add group is clicked", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /add group/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddGroupModal when cancel is clicked", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /add group/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        test("renders group names when groups exist", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText("Trip")).toBeInTheDocument();
        });

        test("renders all groups when multiple exist", () => {
            setupGroupWithTwoMembers();
            useAppStore.getState().addGroup("Dinn", [1, 2]);
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText("Trip")).toBeInTheDocument();
            expect(screen.getByText("Dinn")).toBeInTheDocument();
        });

        test("shows member count for each group", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByText("2 members")).toBeInTheDocument();
        });

        test("calls onNavigate with correct groupId when group is clicked", async () => {
            setupGroupWithTwoMembers();
            const onNavigate = vi.fn();
            render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);
            await userEvent.click(
                screen.getByRole("button", { name: /trip/i }),
            );
            expect(onNavigate).toHaveBeenCalledWith({
                screen: "group",
                groupId: 1,
            });
        });

        test("marks active group with aria-current", () => {
            setupGroupWithTwoMembers();
            render(
                <Sidebar
                    {...defaultProps}
                    view={{ screen: "group", groupId: 1 }}
                />,
            );
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).toHaveAttribute("aria-current", "page");
        });

        test("does not mark inactive group with aria-current", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).not.toHaveAttribute("aria-current");
        });

        test("does not mark group with aria-current when a different group is active", () => {
            setupGroupWithTwoMembers();
            render(
                <Sidebar
                    {...defaultProps}
                    view={{ screen: "group", groupId: 999 }}
                />,
            );
            expect(
                screen.getByRole("button", { name: /trip/i }),
            ).not.toHaveAttribute("aria-current");
        });
    });

    describe("onClose", () => {
        test("calls onClose when a group is clicked", async () => {
            setupGroupWithTwoMembers();
            const onClose = vi.fn();
            render(<Sidebar {...defaultProps} onClose={onClose} />);
            await userEvent.click(
                screen.getByRole("button", { name: /trip/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not throw when onClose is not provided", async () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            await expect(
                userEvent.click(screen.getByRole("button", { name: /trip/i })),
            ).resolves.not.toThrow();
        });
    });
});
