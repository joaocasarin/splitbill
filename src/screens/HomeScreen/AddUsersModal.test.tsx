import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddUsersModal } from "./AddUsersModal";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

beforeEach(() => {
    setupStoreOnly();
});

function renderModal(open = true, onClose = vi.fn()) {
    return {
        onClose,
        ...render(<AddUsersModal open={open} onClose={onClose} />),
    };
}

describe("AddUsersModal", () => {
    describe("initial state", () => {
        test("renders one name input when opened", () => {
            renderModal();
            expect(screen.getAllByPlaceholderText("Name")).toHaveLength(1);
        });

        test("Create button is disabled when input is empty", () => {
            renderModal();
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("remove button is not shown when only one entry", () => {
            renderModal();
            expect(
                screen.queryByRole("button", { name: /remove/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("validation", () => {
        test("Create button is disabled when name is shorter than 3 chars", async () => {
            renderModal();
            await userEvent.type(screen.getByPlaceholderText("Name"), "Ab");
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create button is enabled when name has 3 or more chars", async () => {
            renderModal();
            await userEvent.type(screen.getByPlaceholderText("Name"), "Alice");
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeEnabled();
        });

        test("Create button is disabled when any entry is invalid", async () => {
            renderModal();
            await userEvent.type(screen.getByPlaceholderText("Name"), "Alice");
            await userEvent.click(screen.getByText(/add another/i));
            // second input is empty → should be disabled
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });
    });

    describe("adding entries", () => {
        test("clicking Add another adds a new input", async () => {
            renderModal();
            await userEvent.click(screen.getByText(/add another/i));
            expect(screen.getAllByPlaceholderText("Name")).toHaveLength(2);
        });

        test("remove buttons appear when more than one entry exists", async () => {
            renderModal();
            await userEvent.click(screen.getByText(/add another/i));
            expect(
                screen.getAllByRole("button", { name: /remove/i }),
            ).toHaveLength(2);
        });
    });

    describe("removing entries", () => {
        test("clicking remove reduces the entry count", async () => {
            renderModal();
            await userEvent.click(screen.getByText(/add another/i));
            const removeButtons = screen.getAllByRole("button", {
                name: /remove/i,
            });
            await userEvent.click(removeButtons[0]);
            expect(screen.getAllByPlaceholderText("Name")).toHaveLength(1);
        });

        test("remove button disappears when only one entry remains", async () => {
            renderModal();
            await userEvent.click(screen.getByText(/add another/i));
            const removeButtons = screen.getAllByRole("button", {
                name: /remove/i,
            });
            await userEvent.click(removeButtons[1]);
            expect(
                screen.queryByRole("button", { name: /remove/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("creating users", () => {
        test("clicking Create calls addUser for each valid entry", async () => {
            renderModal();
            await userEvent.type(screen.getByPlaceholderText("Name"), "Alice");
            await userEvent.click(screen.getByText(/add another/i));
            const inputs = screen.getAllByPlaceholderText("Name");
            await userEvent.type(inputs[1], "Bob");
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            const users = useAppStore.getState().global.users;
            expect(users).toHaveLength(2);
            expect(users[0].name).toBe("Alice");
            expect(users[1].name).toBe("Bob");
        });

        test("calls onClose after creating users", async () => {
            const { onClose } = renderModal();
            await userEvent.type(screen.getByPlaceholderText("Name"), "Alice");
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("trims whitespace from names on create", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText("Name"),
                "  Alice  ",
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            expect(useAppStore.getState().global.users[0].name).toBe("Alice");
        });
    });

    describe("cancelling", () => {
        test("clicking Cancel calls onClose", async () => {
            const { onClose } = renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });
    });

    describe("handleOpenChange", () => {
        test("calling with true is a no-op", async () => {
            const onClose = vi.fn();
            renderModal(true, onClose);
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            expect(onClose).not.toHaveBeenCalled();
        });
    });
});
