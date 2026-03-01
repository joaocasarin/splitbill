import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HomeScreen } from "./HomeScreen";

beforeEach(() => {
    setupStoreOnly();
});

describe("HomeScreen", () => {
    describe("empty state", () => {
        test("shows user empty state when no users exist", () => {
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.getByText(/start by adding at least two users/i),
            ).toBeInTheDocument();
        });

        test("shows group empty state when no groups exist", () => {
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.getByText(/add at least two users to unlock/i),
            ).toBeInTheDocument();
        });

        test("group empty state message changes when users are sufficient", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(screen.getByText(/now create a group/i)).toBeInTheDocument();
        });
    });

    describe("Add group button", () => {
        test("is disabled when fewer than 2 users exist", () => {
            useAppStore.getState().addUser("Alice");
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeDisabled();
        });

        test("is enabled when 2 or more users exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.getByRole("button", { name: /add group/i }),
            ).toBeEnabled();
        });
    });

    describe("users list", () => {
        test("renders user names when users exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Bob")).toBeInTheDocument();
        });
    });

    describe("groups list", () => {
        test("renders group names when groups exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(screen.getByText("Trip")).toBeInTheDocument();
        });

        test("calls onNavigate with correct groupId when group is clicked", async () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const onNavigate = vi.fn();
            render(<HomeScreen onNavigate={onNavigate} />);
            await userEvent.click(screen.getByText("Trip"));
            expect(onNavigate).toHaveBeenCalledWith({
                screen: "group",
                groupId: 1,
            });
        });

        test("shows member count for each group", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(screen.getByText("2 members")).toBeInTheDocument();
        });
    });
});
