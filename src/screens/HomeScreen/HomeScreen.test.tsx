import { render, screen } from "@testing-library/react";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HomeScreen } from "./HomeScreen";

vi.mock("@screens/HomeScreen/ImportDropZone", () => ({
    ImportDropZone: () => (
        <div data-testid="import-drop-zone">mock-import-drop-zone</div>
    ),
}));

beforeEach(() => {
    setupStoreOnly();
});

describe("HomeScreen", () => {
    describe("empty state", () => {
        test("renders ImportDropZone when status is empty", () => {
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(screen.getByTestId("import-drop-zone")).toBeInTheDocument();
        });
    });

    describe("loaded state", () => {
        test("shows prompt to select a group from the sidebar when groups exist", () => {
            setupGroupWithTwoMembers();
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.getByText(/select a group from the sidebar/i),
            ).toBeInTheDocument();
        });

        test("does not render ImportDropZone when groups exist", () => {
            setupGroupWithTwoMembers();
            render(<HomeScreen onNavigate={vi.fn()} />);
            expect(
                screen.queryByTestId("import-drop-zone"),
            ).not.toBeInTheDocument();
        });
    });
});
