import { App } from "@app";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupGroupWithTwoMembers } from "@tests/helpers";
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
        setupGroupWithTwoMembers();

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

    test("opens mobile sidebar when burger button is clicked", async () => {
        render(<App />);
        await userEvent.click(
            screen.getByRole("button", { name: /toggle sidebar/i }),
        );
        expect(
            screen.getByRole("button", { name: /close sidebar/i }),
        ).toBeInTheDocument();
    });

    test("closes mobile sidebar when backdrop is clicked", async () => {
        render(<App />);
        await userEvent.click(
            screen.getByRole("button", { name: /toggle sidebar/i }),
        );
        await userEvent.click(
            screen.getByRole("button", { name: /close sidebar/i }),
        );
        expect(
            screen.queryByRole("button", { name: /close sidebar/i }),
        ).not.toBeInTheDocument();
    });
});
