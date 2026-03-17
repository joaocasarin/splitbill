import { USER_NAME_MAX, USER_NAME_MIN } from "@domain/common";
import { useAppStore } from "@store";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreAndWindow } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddMemberModal } from "./AddMemberModal";

vi.mock("@components/ui/button", () => ({
    Button: ({
        children,
        disabled,
        onClick,
        variant: _v,
        size: _s,
        ...props
    }: {
        children?: import("react").ReactNode;
        disabled?: boolean;
        onClick?: import("react").MouseEventHandler<HTMLButtonElement>;
        variant?: string;
        size?: string;
    }) => (
        <button
            aria-disabled={disabled ? "true" : undefined}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    ),
    buttonVariants: () => "",
}));

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

beforeEach(() => {
    setupStoreAndWindow({ restoreMocks: true });
});

function renderModal(groupId: number, open = true, onClose = vi.fn()) {
    return {
        onClose,
        ...render(
            <AddMemberModal groupId={groupId} open={open} onClose={onClose} />,
        ),
    };
}

describe("AddMemberModal", () => {
    describe("initial state", () => {
        test("shows name text input", () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            expect(screen.getByRole("textbox")).toBeInTheDocument();
        });

        test("Add button is disabled when name is empty", () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toHaveAttribute("aria-disabled", "true");
        });
    });

    describe("validation", () => {
        test("Add button is disabled when name is too short", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(
                screen.getByRole("textbox"),
                "A".repeat(USER_NAME_MIN - 1),
            );
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toHaveAttribute("aria-disabled", "true");
        });

        test("Add button is disabled when name is too long", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(
                screen.getByRole("textbox"),
                "A".repeat(USER_NAME_MAX + 1),
            );
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toHaveAttribute("aria-disabled", "true");
        });

        test("Add button is enabled when name meets minimum length", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(
                screen.getByRole("textbox"),
                "A".repeat(USER_NAME_MIN),
            );
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).not.toHaveAttribute("aria-disabled");
        });
    });

    describe("adding member", () => {
        test("adds member to group by name on confirm", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "Carol");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            const updated = useAppStore.getState().global.groups[0];
            const carol = updated.members?.find((m) => m.name === "Carol");
            expect(carol).toBeDefined();
        });

        test("calls onClose after adding", async () => {
            const group = setupGroupWithTwoMembers();
            const { onClose } = renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "Carol");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("resets name input after adding", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "Carol");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(screen.getByRole("textbox")).toHaveValue("");
        });

        test("trims whitespace from name", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "  Carol  ");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            const updated = useAppStore.getState().global.groups[0];
            const carol = updated.members?.find((m) => m.name === "Carol");
            expect(carol).toBeDefined();
        });
    });

    describe("cancelling", () => {
        test("calls onClose when Cancel is clicked", async () => {
            const group = setupGroupWithTwoMembers();
            const { onClose } = renderModal(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not add member when cancelled", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "Carol");
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            const updated = useAppStore.getState().global.groups[0];
            expect(
                updated.members?.find((m) => m.name === "Carol"),
            ).toBeUndefined();
        });

        test("resets name input when cancelled", async () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            await userEvent.type(screen.getByRole("textbox"), "Carol");
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(screen.getByRole("textbox")).toHaveValue("");
        });
    });

    describe("handleOpenChange", () => {
        test("calling with true is a no-op", async () => {
            const group = setupGroupWithTwoMembers();
            const onClose = vi.fn();
            renderModal(group.id, true, onClose);
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("handleAdd is a no-op when name is empty", () => {
            const group = setupGroupWithTwoMembers();
            renderModal(group.id);
            fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
            const updated = useAppStore.getState().global.groups[0];
            expect(updated.members).toHaveLength(2);
        });
    });
});
