import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErrorScreen } from "./ErrorScreen";

const mockInitEmpty = vi.fn();
let mockError: string | null = null;

vi.mock("@store", () => ({
    useAppStore: () => ({ error: mockError, initEmpty: mockInitEmpty }),
}));

vi.mock("@components/ui/button", () => ({
    Button: ({
        children,
        onClick,
    }: {
        children: React.ReactNode;
        onClick: () => void;
    }) => (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockError = null;
});

describe("ErrorScreen", () => {
    describe("initial state", () => {
        test("renders the error message from the store", () => {
            mockError =
                "Failed to load state from URL: the data is invalid or corrupted";
            render(<ErrorScreen />);
            expect(
                screen.getByText(
                    "Failed to load state from URL: the data is invalid or corrupted",
                ),
            ).toBeInTheDocument();
        });

        test("renders all lines when error contains multiple messages", () => {
            mockError =
                "Group 'braddock' (createdAt): Invalid input\nGroup 'braddock' (members.0.createdAt): Invalid input";
            render(<ErrorScreen />);
            expect(
                screen.getByText(/Group 'braddock' \(createdAt\)/),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Group 'braddock' \(members\.0\.createdAt\)/),
            ).toBeInTheDocument();
        });

        test("renders fallback message when error is null", () => {
            render(<ErrorScreen />);
            expect(
                screen.getByText("An unknown error occurred."),
            ).toBeInTheDocument();
        });

        test("renders back to home button", () => {
            render(<ErrorScreen />);
            expect(
                screen.getByRole("button", { name: /back to home/i }),
            ).toBeInTheDocument();
        });
    });

    describe("back navigation", () => {
        test("clicking back button calls initEmpty", async () => {
            render(<ErrorScreen />);
            await userEvent.click(
                screen.getByRole("button", { name: /back to home/i }),
            );
            expect(mockInitEmpty).toHaveBeenCalledOnce();
        });

        test("clicking back button clears the URL search params", async () => {
            const replaceStateSpy = vi
                .spyOn(window.history, "replaceState")
                .mockImplementation(() => {});
            render(<ErrorScreen />);
            await userEvent.click(
                screen.getByRole("button", { name: /back to home/i }),
            );
            expect(replaceStateSpy).toHaveBeenCalledWith(
                null,
                "",
                window.location.pathname,
            );
        });
    });
});
