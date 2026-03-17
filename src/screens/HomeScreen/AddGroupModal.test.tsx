import { GROUP_NAME_MAX } from "@domain/common";
import { useAppStore } from "@store";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreAndWindow } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddGroupModal } from "./AddGroupModal";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

beforeEach(() => {
    setupStoreAndWindow();
});

function renderModal(open = true, onClose = vi.fn()) {
    return {
        onClose,
        ...render(<AddGroupModal open={open} onClose={onClose} />),
    };
}

describe("AddGroupModal", () => {
    describe("initial state", () => {
        test("renders group name input", () => {
            renderModal();
            expect(screen.getByPlaceholderText(/e\.g\./i)).toBeInTheDocument();
        });

        test("renders two member name inputs", () => {
            renderModal();
            expect(screen.getByPlaceholderText("Member 1")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Member 2")).toBeInTheDocument();
        });

        test("Create button is disabled initially", () => {
            renderModal();
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("does not show remove buttons when only 2 rows", () => {
            renderModal();
            expect(
                screen.queryByRole("button", { name: /remove member/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("validation", () => {
        test("Create is disabled when group name is too short", async () => {
            renderModal();
            await userEvent.type(screen.getByPlaceholderText(/e\.g\./i), "Hi");
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create is disabled when group name is too long", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "A".repeat(GROUP_NAME_MAX + 1),
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create is disabled when fewer than 2 valid member names", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });

        test("Create is enabled with valid name and 2 valid member names", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeEnabled();
        });

        test("member name too short is not counted as valid", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(screen.getByPlaceholderText("Member 1"), "Al");
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            expect(
                screen.getByRole("button", { name: /create/i }),
            ).toBeDisabled();
        });
    });

    describe("adding member rows", () => {
        test("clicking Add member adds a third input row", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            expect(screen.getByPlaceholderText("Member 3")).toBeInTheDocument();
        });

        test("shows remove buttons when more than 2 rows", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            expect(
                screen.getAllByRole("button", { name: /remove member/i }),
            ).toHaveLength(3);
        });

        test("clicking remove button removes that row", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            await userEvent.click(
                screen.getAllByRole("button", {
                    name: /remove member/i,
                })[2],
            );
            expect(
                screen.queryByPlaceholderText("Member 3"),
            ).not.toBeInTheDocument();
        });
    });

    describe("creating group", () => {
        test("creates group with trimmed names", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "  Trip  ",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            const groups = useAppStore.getState().global.groups;
            expect(groups).toHaveLength(1);
            expect(groups[0].name).toBe("Trip");
            expect(groups[0].members?.[0].name).toBe("Alice");
            expect(groups[0].members?.[1].name).toBe("Bob");
        });

        test("calls onClose after creating", async () => {
            const { onClose } = renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("resets form after creating", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            expect(screen.getByPlaceholderText(/e\.g\./i)).toHaveValue("");
        });

        test("only includes valid (non-empty) member names", async () => {
            renderModal();
            await userEvent.click(
                screen.getByRole("button", { name: /add member/i }),
            );
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 1"),
                "Alice",
            );
            await userEvent.type(
                screen.getByPlaceholderText("Member 2"),
                "Bob",
            );
            // Member 3 left empty — should not be included
            await userEvent.click(
                screen.getByRole("button", { name: /create/i }),
            );
            const groups = useAppStore.getState().global.groups;
            expect(groups[0].members).toHaveLength(2);
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

        test("does not create a group when cancelled", async () => {
            renderModal();
            await userEvent.type(
                screen.getByPlaceholderText(/e\.g\./i),
                "Trip",
            );
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(useAppStore.getState().global.groups).toHaveLength(0);
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

    describe("defensive guards (unreachable in valid usage)", () => {
        test("handleCreate is a no-op when canCreate is false", () => {
            renderModal();
            fireEvent.submit(screen.getByTestId("add-group-form"));
            expect(useAppStore.getState().global.groups).toHaveLength(0);
        });
    });
});
