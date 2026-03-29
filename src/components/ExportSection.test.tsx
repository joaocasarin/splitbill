import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ExportSection } from "./ExportSection";

type Props = Parameters<typeof ExportSection>[0];

const defaultProps: Props = {
    hasGroups: true,
    onExport: vi.fn(),
};

function renderSection(overrides: Partial<Props> = {}) {
    return render(<ExportSection {...defaultProps} {...overrides} />);
}

describe("ExportSection", () => {
    describe("initial state", () => {
        test("renders export button when hasGroups is true", () => {
            renderSection({ hasGroups: true });
            expect(
                screen.getByRole("button", { name: /export json/i }),
            ).toBeInTheDocument();
        });

        test("renders nothing when hasGroups is false", () => {
            renderSection({ hasGroups: false });
            expect(
                screen.queryByRole("button", { name: /export json/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("export", () => {
        test("calls onExport when export button is clicked", async () => {
            const onExport = vi.fn();
            renderSection({ onExport });
            await userEvent.click(
                screen.getByRole("button", { name: /export json/i }),
            );
            expect(onExport).toHaveBeenCalledOnce();
        });
    });
});
