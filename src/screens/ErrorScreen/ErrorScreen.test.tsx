import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ErrorScreen } from "./ErrorScreen";

describe("ErrorScreen", () => {
    test("renders error message", () => {
        render(<ErrorScreen />);
        expect(
            screen.getByText(/invalid or corrupted state/i),
        ).toBeInTheDocument();
    });
});
