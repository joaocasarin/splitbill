import type { User } from "@domain/user";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { UsersSection } from "./UsersSection";

const users: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
];

function renderSection(usersArg: User[] = users, onAddUser = vi.fn()) {
    return render(<UsersSection users={usersArg} onAddUser={onAddUser} />);
}

describe("UsersSection", () => {
    describe("initial state", () => {
        test("renders Users heading", () => {
            renderSection();
            expect(screen.getByText("Users")).toBeInTheDocument();
        });

        test("renders Add user button", () => {
            renderSection();
            expect(
                screen.getByRole("button", { name: /add user/i }),
            ).toBeInTheDocument();
        });
    });

    describe("empty state", () => {
        test("shows empty message when no users exist", () => {
            renderSection([]);
            expect(
                screen.getByText(/start by adding at least two users/i),
            ).toBeInTheDocument();
        });

        test("does not show empty message when users exist", () => {
            renderSection();
            expect(
                screen.queryByText(/start by adding at least two users/i),
            ).not.toBeInTheDocument();
        });
    });

    describe("user list", () => {
        test("renders user names", () => {
            renderSection();
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Bob")).toBeInTheDocument();
        });

        test("renders avatar initial in uppercase", () => {
            renderSection();
            expect(screen.getByText("A")).toBeInTheDocument();
            expect(screen.getByText("B")).toBeInTheDocument();
        });
    });

    describe("onAddUser", () => {
        test("calls onAddUser when Add user is clicked", async () => {
            const onAddUser = vi.fn();
            renderSection(users, onAddUser);
            await userEvent.click(
                screen.getByRole("button", { name: /add user/i }),
            );
            expect(onAddUser).toHaveBeenCalledOnce();
        });
    });
});
