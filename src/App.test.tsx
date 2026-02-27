import { App } from "@app";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

describe("App", () => {
    test("renders heading", () => {
        render(<App />);
        expect(screen.getByRole("heading", { name: "Ola" })).toBeDefined();
    });
});
