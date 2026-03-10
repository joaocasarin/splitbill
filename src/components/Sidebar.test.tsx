import type { AppView } from "@app";
import type { Group } from "@domain/group";
import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Sidebar } from "./Sidebar";

let capturedGroupsProps: {
    groups: Group[];
    view: AppView;
    canCreateGroup: boolean;
    onClose?: () => void;
} | null = null;

vi.mock("@components/UsersSection", () => ({
    UsersSection: ({
        users,
        onAddUser,
    }: {
        users: unknown[];
        onAddUser: () => void;
    }) => (
        <div data-testid="users-section">
            <span data-testid="users-count">{(users as unknown[]).length}</span>
            <button type="button" onClick={onAddUser}>
                mock-add-user
            </button>
        </div>
    ),
}));

vi.mock("@components/GroupsSection", () => ({
    GroupsSection: ({
        groups,
        view,
        canCreateGroup,
        onAddGroup,
        onNavigate,
        onClose,
    }: {
        groups: Group[];
        view: AppView;
        canCreateGroup: boolean;
        onAddGroup: () => void;
        onNavigate: (view: AppView) => void;
        onClose?: () => void;
    }) => {
        capturedGroupsProps = { groups, view, canCreateGroup, onClose };
        return (
            <div data-testid="groups-section">
                <span data-testid="groups-count">{groups.length}</span>
                <span data-testid="can-create-group">
                    {String(canCreateGroup)}
                </span>
                <button type="button" onClick={onAddGroup}>
                    mock-add-group
                </button>
                <button
                    type="button"
                    onClick={() => onNavigate({ screen: "group", groupId: 1 })}
                >
                    mock-navigate
                </button>
            </div>
        );
    },
}));

const defaultProps = {
    view: { screen: "home" as const },
    onNavigate: vi.fn(),
};

beforeEach(() => {
    setupStoreOnly();
    vi.clearAllMocks();
    capturedGroupsProps = null;
});

describe("Sidebar", () => {
    describe("users section", () => {
        test("renders UsersSection with users from store", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByTestId("users-section")).toBeInTheDocument();
            expect(screen.getByTestId("users-count")).toHaveTextContent("2");
        });

        test("opens AddUsersModal when UsersSection triggers onAddUser", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /mock-add-user/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddUsersModal when cancel is clicked", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /mock-add-user/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("groups section", () => {
        test("renders GroupsSection with groups from store", () => {
            setupGroupWithTwoMembers();
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByTestId("groups-section")).toBeInTheDocument();
            expect(screen.getByTestId("groups-count")).toHaveTextContent("1");
        });

        test("passes canCreateGroup as false when fewer than 2 users", () => {
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByTestId("can-create-group")).toHaveTextContent(
                "false",
            );
        });

        test("passes canCreateGroup as true when 2 or more users exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<Sidebar {...defaultProps} />);
            expect(screen.getByTestId("can-create-group")).toHaveTextContent(
                "true",
            );
        });

        test("passes view and onClose to GroupsSection", () => {
            const onClose = vi.fn();
            const view: AppView = { screen: "group", groupId: 1 };
            render(<Sidebar {...defaultProps} view={view} onClose={onClose} />);
            expect(capturedGroupsProps?.view).toEqual(view);
            expect(capturedGroupsProps?.onClose).toBe(onClose);
        });

        test("opens AddGroupModal when GroupsSection triggers onAddGroup", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /mock-add-group/i }),
            );
            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        test("closes AddGroupModal when cancel is clicked", async () => {
            render(<Sidebar {...defaultProps} />);
            await userEvent.click(
                screen.getByRole("button", { name: /mock-add-group/i }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        test("passes onNavigate to GroupsSection", async () => {
            const onNavigate = vi.fn();
            render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);
            await userEvent.click(
                screen.getByRole("button", { name: /mock-navigate/i }),
            );
            expect(onNavigate).toHaveBeenCalledWith({
                screen: "group",
                groupId: 1,
            });
        });
    });
});
