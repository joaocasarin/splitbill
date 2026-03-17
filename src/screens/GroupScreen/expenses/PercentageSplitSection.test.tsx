import { fireEvent, render, screen } from "@testing-library/react";
import { testMembers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import { PercentageSplitSection } from "./PercentageSplitSection";

const members = testMembers;

describe("PercentageSplitSection", () => {
    describe("initial state", () => {
        test("renders Shares heading", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText("Shares")).toBeInTheDocument();
        });

        test("renders a number input for each member", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    onShareChange={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("spinbutton", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("spinbutton", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("falls back to 0 for a member not in shares map", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={new Map()}
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getAllByRole("spinbutton")[0]).toHaveValue(0);
        });

        test("renders a % label next to each input", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getAllByText("%")).toHaveLength(2);
        });
    });

    describe("percentage hint", () => {
        test("shows current percentage when shares do not sum to 100%", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 3000],
                            [2, 3000],
                        ])
                    }
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText("60%")).toBeInTheDocument();
        });

        test("shows ✓ 100% confirmation when shares equal BPS_TOTAL", () => {
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 6000],
                            [2, 4000],
                        ])
                    }
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText("✓ 100%")).toBeInTheDocument();
        });
    });

    describe("onShareChange", () => {
        test("calls onShareChange with member id and value", () => {
            const onShareChange = vi.fn();
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    onShareChange={onShareChange}
                />,
            );
            fireEvent.change(screen.getByRole("spinbutton", { name: "Bob" }), {
                target: { value: "50" },
            });
            expect(onShareChange).toHaveBeenCalledWith(2, 50);
        });

        test("calls onShareChange with correct id for each member", () => {
            const onShareChange = vi.fn();
            render(
                <PercentageSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    onShareChange={onShareChange}
                />,
            );
            fireEvent.change(
                screen.getByRole("spinbutton", { name: "Alice" }),
                { target: { value: "30" } },
            );
            expect(onShareChange).toHaveBeenCalledWith(1, 30);
        });
    });
});
