import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddGroupModal } from "./AddGroupModal";

beforeEach(() => {
    setupStoreOnly();
});

function renderModal(open = true, onClose = vi.fn()) {
    return {
        onClose,
        ...render(<AddGroupModal open={open} onClose={onClose} />),
    };
}

function setupTwoUsers() {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
}

describe("AddGroupModal", () => {
    describe("initial state", () => {
        test("renders name input", () => {
            setupTwoUsers();
            renderModal();
            expect(screen.getByPlaceholderText(/e.g./i)).toBeInTheDocument();
        });

        test("renders a checkbox for each user", () => {
            setupTwoUsers();
            renderModal();
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("all checkboxes are unchecked initially", () => {
            setupTwoUsers();
            renderModal();
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).not.toBeChecked();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).not.toBeChecked();
        });

        test("Create button is disabled initially", () => {
            setupTwoUsers();
            renderModal();
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });
    });

    describe("validation", () => {
        test("Create is disabled when name is too short", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e.g./i), "Hi");
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create is disabled when fewer than 2 members are selected", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e.g./i), "Trip");
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create is enabled when name is valid and 2+ members selected", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e.g./i), "Trip");
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeEnabled();
        });
    });

    describe("member selection", () => {
        test("clicking a checkbox selects the member", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeChecked();
        });

        test("clicking a checked checkbox deselects the member", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).not.toBeChecked();
        });
    });

    describe("creating group", () => {
        test("calls addGroup with trimmed name and selected member ids", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e.g./i),
                "  Trip  ",
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            const groups = useAppStore.getState().global.groups;
            expect(groups).toHaveLength(1);
            expect(groups[0].name).toBe("Trip");
            expect(groups[0].memberIds).toContain(1);
            expect(groups[0].memberIds).toContain(2);
        });

        test("calls onClose after creating", async () => {
            setupTwoUsers();
            const { onClose } = renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e.g./i), "Trip");
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });
    });

    describe("cancelling", () => {
        test("clicking Cancel calls onClose", async () => {
            setupTwoUsers();
            const { onClose } = renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not create a group when cancelled", async () => {
            setupTwoUsers();
            renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e.g./i), "Trip");
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(useAppStore.getState().global.groups).toHaveLength(0);
        });
    });
});
