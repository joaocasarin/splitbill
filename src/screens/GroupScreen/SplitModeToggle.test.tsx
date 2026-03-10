import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SplitModeToggle } from "./SplitModeToggle";

describe("SplitModeToggle", () => {
    describe("initial state", () => {
        test("renders all three mode buttons", () => {
            render(<SplitModeToggle splitMode="equal" onChange={vi.fn()} />);
            expect(
                screen.getByRole("button", { name: "equal" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "fixed" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "percentage" }),
            ).toBeInTheDocument();
        });
    });

    describe("active mode", () => {
        test("marks equal as pressed when splitMode is equal", () => {
            render(<SplitModeToggle splitMode="equal" onChange={vi.fn()} />);
            expect(
                screen.getByRole("button", { name: "equal" }),
            ).toHaveAttribute("aria-pressed", "true");
            expect(
                screen.getByRole("button", { name: "fixed" }),
            ).toHaveAttribute("aria-pressed", "false");
            expect(
                screen.getByRole("button", { name: "percentage" }),
            ).toHaveAttribute("aria-pressed", "false");
        });

        test("marks fixed as pressed when splitMode is fixed", () => {
            render(<SplitModeToggle splitMode="fixed" onChange={vi.fn()} />);
            expect(
                screen.getByRole("button", { name: "fixed" }),
            ).toHaveAttribute("aria-pressed", "true");
            expect(
                screen.getByRole("button", { name: "equal" }),
            ).toHaveAttribute("aria-pressed", "false");
            expect(
                screen.getByRole("button", { name: "percentage" }),
            ).toHaveAttribute("aria-pressed", "false");
        });

        test("marks percentage as pressed when splitMode is percentage", () => {
            render(
                <SplitModeToggle splitMode="percentage" onChange={vi.fn()} />,
            );
            expect(
                screen.getByRole("button", { name: "percentage" }),
            ).toHaveAttribute("aria-pressed", "true");
            expect(
                screen.getByRole("button", { name: "equal" }),
            ).toHaveAttribute("aria-pressed", "false");
            expect(
                screen.getByRole("button", { name: "fixed" }),
            ).toHaveAttribute("aria-pressed", "false");
        });
    });

    describe("onChange", () => {
        test("calls onChange with equal when equal is clicked", async () => {
            const onChange = vi.fn();
            render(<SplitModeToggle splitMode="fixed" onChange={onChange} />);
            await userEvent.click(screen.getByRole("button", { name: "equal" }));
            expect(onChange).toHaveBeenCalledWith("equal");
        });

        test("calls onChange with fixed when fixed is clicked", async () => {
            const onChange = vi.fn();
            render(<SplitModeToggle splitMode="equal" onChange={onChange} />);
            await userEvent.click(screen.getByRole("button", { name: "fixed" }));
            expect(onChange).toHaveBeenCalledWith("fixed");
        });

        test("calls onChange with percentage when percentage is clicked", async () => {
            const onChange = vi.fn();
            render(<SplitModeToggle splitMode="equal" onChange={onChange} />);
            await userEvent.click(
                screen.getByRole("button", { name: "percentage" }),
            );
            expect(onChange).toHaveBeenCalledWith("percentage");
        });
    });
});
