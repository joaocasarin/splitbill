import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { DataTransferControls } from "./DataTransferControls";

type Props = Parameters<typeof DataTransferControls>[0];

const defaultProps: Props = {
    hasGroups: true,
    onExport: vi.fn(),
};

function renderControls(overrides: Partial<Props> = {}) {
    return render(<DataTransferControls {...defaultProps} {...overrides} />);
}

describe("DataTransferControls", () => {
    describe("initial state", () => {
        test("renders export button when hasGroups is true", () => {
            renderControls({ hasGroups: true });
            expect(
                screen.getByRole("button", { name: /export json/i }),
            ).toBeInTheDocument();
        });

        test("renders nothing when hasGroups is false", () => {
            renderControls({ hasGroups: false });
            expect(
                screen.queryByRole("button", { name: /export json/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("export", () => {
        test("calls onExport when export button is clicked", async () => {
            const onExport = vi.fn();
            renderControls({ onExport });
            await userEvent.click(
                screen.getByRole("button", { name: /export json/i }),
            );
            expect(onExport).toHaveBeenCalledOnce();
        });
    });
});
