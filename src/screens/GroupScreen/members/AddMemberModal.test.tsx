import { useAppStore } from "@store";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithNonMember } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
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
    setupStoreOnly();
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
        test("shows select with non-members only", () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            expect(
                screen.getByRole("option", { name: "Carol" }),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole("option", { name: "Alice" }),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByRole("option", { name: "Bob" }),
            ).not.toBeInTheDocument();
        });

        test("Add button is disabled initially", () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toHaveAttribute("aria-disabled", "true");
        });
    });

    describe("adding member", () => {
        test("Add button is enabled after selecting a user", async () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).not.toHaveAttribute("aria-disabled");
        });

        test("adds member to group on confirm", async () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            const updated = useAppStore.getState().global.groups[0];
            expect(updated.memberIds).toContain(3);
        });

        test("calls onClose after adding", async () => {
            const group = setupGroupWithNonMember();
            const { onClose } = renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            await userEvent.click(
                screen.getByRole("button", { name: /^add$/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does nothing when Add is clicked without selecting a user", () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
            const updated = useAppStore.getState().global.groups[0];
            expect(updated.memberIds).not.toContain(3);
        });
    });

    describe("cancelling", () => {
        test("calls onClose when Cancel is clicked", async () => {
            const group = setupGroupWithNonMember();
            const { onClose } = renderModal(group.id);
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("does not add member when cancelled", async () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            const updated = useAppStore.getState().global.groups[0];
            expect(updated.memberIds).not.toContain(3);
        });

        test("deselecting option re-disables Add button", async () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            await userEvent.selectOptions(screen.getByRole("combobox"), "");
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toHaveAttribute("aria-disabled", "true");
        });
    });

    describe("handleOpenChange", () => {
        test("calling with true is a no-op", async () => {
            const group = setupGroupWithNonMember();
            const onClose = vi.fn();
            renderModal(group.id, true, onClose);
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            expect(onClose).not.toHaveBeenCalled();
        });
    });
});
