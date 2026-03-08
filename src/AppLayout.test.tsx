import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AppLayout } from "./AppLayout";

describe("AppLayout", () => {
    test("renders brand name", () => {
        render(
            <AppLayout sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(screen.getByText("Splitbill")).toBeInTheDocument();
    });

    test("renders tagline", () => {
        render(
            <AppLayout sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByText(/split the bill, not the friendship./i),
        ).toBeInTheDocument();
    });

    test("renders sidebar content", () => {
        render(
            <AppLayout sidebar={<div>sidebar content</div>}>
                <div />
            </AppLayout>,
        );
        expect(screen.getByText("sidebar content")).toBeInTheDocument();
    });

    test("renders children content", () => {
        render(
            <AppLayout sidebar={<div />}>
                <div>main content</div>
            </AppLayout>,
        );
        expect(screen.getByText("main content")).toBeInTheDocument();
    });
});
