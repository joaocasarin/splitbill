import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

vi.mock("@components/ui/dialog", () => import("@tests/mocks/ui/dialog"));

function renderDialog(
    overrides: Partial<Parameters<typeof ConfirmDeleteDialog>[0]> = {},
) {
    const props = {
        open: true,
        title: "Delete expense",
        description: "This action cannot be undone.",
        onConfirm: vi.fn(),
        onClose: vi.fn(),
        ...overrides,
    };
    return { props, ...render(<ConfirmDeleteDialog {...props} />) };
}

describe("ConfirmDeleteDialog", () => {
    describe("initial state", () => {
        test("renders title", () => {
            renderDialog();
            expect(screen.getByText("Delete expense")).toBeInTheDocument();
        });

        test("renders description", () => {
            renderDialog();
            expect(
                screen.getByText("This action cannot be undone."),
            ).toBeInTheDocument();
        });

        test("renders Cancel button", () => {
            renderDialog();
            expect(
                screen.getByRole("button", { name: /cancel/i }),
            ).toBeInTheDocument();
        });

        test("renders Delete button", () => {
            renderDialog();
            expect(
                screen.getByRole("button", { name: /delete/i }),
            ).toBeInTheDocument();
        });

        test("does not render content when closed", () => {
            renderDialog({ open: false });
            expect(
                screen.queryByText("Delete expense"),
            ).not.toBeInTheDocument();
        });
    });

    describe("handler wiring", () => {
        test("Delete button calls onConfirm", async () => {
            const { props } = renderDialog();
            await userEvent.click(
                screen.getByRole("button", { name: /delete/i }),
            );
            expect(props.onConfirm).toHaveBeenCalledOnce();
        });

        test("Cancel button calls onClose", async () => {
            const { props } = renderDialog();
            await userEvent.click(
                screen.getByRole("button", { name: /cancel/i }),
            );
            expect(props.onClose).toHaveBeenCalledOnce();
        });
    });

    describe("handleOpenChange", () => {
        test("closing dialog calls onClose", async () => {
            const { props } = renderDialog();
            await userEvent.click(screen.getByTestId("__dialog_open__"));
            // onOpenChange(true) does not call onClose
            expect(props.onClose).not.toHaveBeenCalled();
        });
    });
});
