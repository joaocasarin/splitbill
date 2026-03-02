import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddMemberModal } from "./AddMemberModal";

beforeEach(() => {
    setupStoreOnly();
});

function setupGroupWithNonMember() {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
    useAppStore.getState().addUser("Carol");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}

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
            ).toBeDisabled();
        });
    });

    describe("adding member", () => {
        test("Add button is enabled after selecting a user", async () => {
            const group = setupGroupWithNonMember();
            renderModal(group.id);
            await userEvent.selectOptions(screen.getByRole("combobox"), "3");
            expect(
                screen.getByRole("button", { name: /^add$/i }),
            ).toBeEnabled();
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
    });
});
