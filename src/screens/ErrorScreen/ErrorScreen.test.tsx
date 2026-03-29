import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErrorScreen } from "./ErrorScreen";

const mockInitEmpty = vi.fn();

vi.mock("@store", () => ({
    useAppStore: () => ({ initEmpty: mockInitEmpty }),
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
});

describe("ErrorScreen", () => {
    describe("initial state", () => {
        test("renders error message", () => {
            render(<ErrorScreen />);
            expect(
                screen.getByText(/invalid or corrupted state/i),
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
