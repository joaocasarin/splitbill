import { render, screen } from "@testing-library/react";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HomeScreen } from "./HomeScreen";

beforeEach(() => {
    setupStoreOnly();
});

describe("HomeScreen", () => {
    test("shows prompt to select a group from the sidebar", () => {
        render(<HomeScreen onNavigate={vi.fn()} />);
        expect(
            screen.getByText(/select a group from the sidebar/i),
        ).toBeInTheDocument();
    });
});
