import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testUsers } from "@tests/mocks";
import { describe, expect, test, vi } from "vitest";
import { EqualSplitSection } from "./EqualSplitSection";

const members = testUsers;

describe("EqualSplitSection", () => {
    describe("initial state", () => {
        test("renders Participants heading", () => {
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set()}
                    onToggle={vi.fn()}
                />,
            );
            expect(screen.getByText("Participants")).toBeInTheDocument();
        });

        test("renders a checkbox for each member", () => {
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set()}
                    onToggle={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).toBeInTheDocument();
        });

        test("renders no checkboxes when members list is empty", () => {
            render(
                <EqualSplitSection
                    members={[]}
                    participantIds={new Set()}
                    onToggle={vi.fn()}
                />,
            );
            expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        });
    });

    describe("checked state", () => {
        test("checkbox is checked when member is in participantIds", () => {
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set([1])}
                    onToggle={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).toBeChecked();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).not.toBeChecked();
        });

        test("checkbox is unchecked when member is not in participantIds", () => {
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set()}
                    onToggle={vi.fn()}
                />,
            );
            expect(
                screen.getByRole("checkbox", { name: "Alice" }),
            ).not.toBeChecked();
            expect(
                screen.getByRole("checkbox", { name: "Bob" }),
            ).not.toBeChecked();
        });
    });

    describe("onToggle", () => {
        test("calls onToggle with member id when checkbox is changed", async () => {
            const onToggle = vi.fn();
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set()}
                    onToggle={onToggle}
                />,
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Alice" }),
            );
            expect(onToggle).toHaveBeenCalledWith(1);
        });

        test("calls onToggle with correct id for each member", async () => {
            const onToggle = vi.fn();
            render(
                <EqualSplitSection
                    members={members}
                    participantIds={new Set()}
                    onToggle={onToggle}
                />,
            );
            await userEvent.click(
                screen.getByRole("checkbox", { name: "Bob" }),
            );
            expect(onToggle).toHaveBeenCalledWith(2);
        });
    });
});
