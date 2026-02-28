import { App } from "@app";
import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

beforeEach(() => {
    useAppStore.getState().initEmpty();
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    Object.defineProperty(window, "location", {
        value: { search: "", href: "http://localhost/" },
        writable: true,
    });
});

describe("App", () => {
    test("renders Splitbill heading", () => {
        render(<App />);
        expect(
            screen.getByRole("heading", { name: "Splitbill" }),
        ).toBeInTheDocument();
    });

    test("renders error screen on error status", () => {
        Object.defineProperty(window, "location", {
            value: {
                search: "?state=invalid",
                href: "http://localhost/?state=invalid",
            },
            writable: true,
        });
        render(<App />);
        expect(
            screen.getByText(/invalid or corrupted state/i),
        ).toBeInTheDocument();
    });

    test("renders group screen when view is group", async () => {
        useAppStore.getState().addUser("Alice");
        useAppStore.getState().addUser("Bob");
        useAppStore.getState().addGroup("Trip", [1, 2]);
        render(<App />);
        await userEvent.click(screen.getByText("Trip"));
        expect(screen.getByText(/group 1/i)).toBeInTheDocument();
    });
});
