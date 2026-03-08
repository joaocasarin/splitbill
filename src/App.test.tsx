import { App } from "@app";
import { useAppStore } from "@store";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStoreAndWindow } from "@tests/setup";
import { beforeEach, describe, expect, test } from "vitest";

beforeEach(() => {
    setupStoreAndWindow();
});

describe("App", () => {
    test("renders Splitbill heading", () => {
        render(<App />);
        expect(screen.getByText("Splitbill")).toBeInTheDocument();
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

        await userEvent.click(screen.getByRole("button", { name: /trip/i }));

        expect(
            screen.getByRole("heading", { name: "Trip" }),
        ).toBeInTheDocument();
    });

    test("renders home screen on initial load", () => {
        render(<App />);
        expect(
            screen.getByText(/select a group from the sidebar to get started/i),
        ).toBeInTheDocument();
    });
});
