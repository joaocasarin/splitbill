import type { User } from "@domain/user";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FixedSplitSection } from "./FixedSplitSection";

const members: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
];

describe("FixedSplitSection", () => {
    describe("initial state", () => {
        test("renders Shares heading", () => {
            render(
                <FixedSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    total={1000}
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText("Shares")).toBeInTheDocument();
        });

        test("renders a currency input for each member", () => {
            render(
                <FixedSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    total={1000}
                    onShareChange={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("textbox", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("textbox", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("falls back to 0 for a member not in shares map", () => {
            render(
                <FixedSplitSection
                    members={members}
                    shares={new Map()}
                    total={1000}
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getAllByRole("textbox")[0]).toHaveValue("0,00");
        });
    });

    describe("ratio hint", () => {
        test("shows ratio when shares do not sum to total", () => {
            render(
                <FixedSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 300],
                            [2, 300],
                        ])
                    }
                    total={1000}
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText(/6,00 \/ 10,00/)).toBeInTheDocument();
        });

        test("shows matches total confirmation when shares equal total", () => {
            render(
                <FixedSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 600],
                            [2, 400],
                        ])
                    }
                    total={1000}
                    onShareChange={vi.fn()}
                />,
            );
            expect(screen.getByText("✓ matches total")).toBeInTheDocument();
        });
    });

    describe("onShareChange", () => {
        test("calls onShareChange with member id and value", () => {
            const onShareChange = vi.fn();
            render(
                <FixedSplitSection
                    members={members}
                    shares={
                        new Map([
                            [1, 0],
                            [2, 0],
                        ])
                    }
                    total={1000}
                    onShareChange={onShareChange}
                />,
            );
            fireEvent.keyDown(screen.getByRole("textbox", { name: "Bob" }), {
                key: "5",
            });
            expect(onShareChange).toHaveBeenCalledWith(2, 5);
        });
    });
});
