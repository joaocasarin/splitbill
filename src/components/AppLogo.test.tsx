import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { AppLogo } from "./AppLogo";

describe("AppLogo", () => {
    describe("accessibility", () => {
        test("svg has aria-hidden", () => {
            const { container } = render(<AppLogo />);
            const svg = container.querySelector("svg");
            expect(svg).toHaveAttribute("aria-hidden", "true");
        });
    });

    describe("size prop", () => {
        test("defaults to 32", () => {
            const { container } = render(<AppLogo />);
            const svg = container.querySelector("svg");
            expect(svg).toHaveAttribute("width", "32");
            expect(svg).toHaveAttribute("height", "32");
        });

        test("applies custom size", () => {
            const { container } = render(<AppLogo size={64} />);
            const svg = container.querySelector("svg");
            expect(svg).toHaveAttribute("width", "64");
            expect(svg).toHaveAttribute("height", "64");
        });
    });

    describe("background variants", () => {
        test("primary applies fill-primary to background rect", () => {
            const { container } = render(<AppLogo background="primary" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[0]).toHaveClass("fill-primary");
        });

        test("secondary applies fill-secondary to background rect", () => {
            const { container } = render(<AppLogo background="secondary" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[0]).toHaveClass("fill-secondary");
        });

        test("none applies fill-transparent to background rect", () => {
            const { container } = render(<AppLogo background="none" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[0]).toHaveClass("fill-transparent");
        });
    });

    describe("foreground variants", () => {
        test("primary applies fill-primary-foreground to bar rects", () => {
            const { container } = render(<AppLogo foreground="primary" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[1]).toHaveClass("fill-primary-foreground");
            expect(rects[2]).toHaveClass("fill-primary-foreground");
            expect(rects[3]).toHaveClass("fill-primary-foreground");
        });

        test("secondary applies fill-secondary-foreground to bar rects", () => {
            const { container } = render(<AppLogo foreground="secondary" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[1]).toHaveClass("fill-secondary-foreground");
            expect(rects[2]).toHaveClass("fill-secondary-foreground");
            expect(rects[3]).toHaveClass("fill-secondary-foreground");
        });

        test("none applies fill-transparent to bar rects", () => {
            const { container } = render(<AppLogo foreground="none" />);
            const rects = container.querySelectorAll("rect");
            expect(rects[1]).toHaveClass("fill-transparent");
            expect(rects[2]).toHaveClass("fill-transparent");
            expect(rects[3]).toHaveClass("fill-transparent");
        });
    });

    describe("label prop", () => {
        test("renders only svg when label is omitted", () => {
            const { container } = render(<AppLogo />);
            expect(container.querySelector("svg")).toBeInTheDocument();
            expect(container.querySelector("div")).not.toBeInTheDocument();
            expect(container.querySelector("span")).not.toBeInTheDocument();
        });

        test("renders svg and label text inside a flex wrapper when label is provided", () => {
            const { container } = render(<AppLogo label="splitbill" />);
            const wrapper = container.querySelector("div");
            expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
            expect(container.querySelector("svg")).toBeInTheDocument();
        });

        test("label span has correct typography classes", () => {
            const { container } = render(<AppLogo label="splitbill" />);
            const span = container.querySelector("span");
            expect(span).toHaveClass(
                "font-semibold",
                "text-base",
                "tracking-tight",
            );
        });

        test("label span renders the provided text", () => {
            const { container } = render(<AppLogo label="splitbill" />);
            expect(container.querySelector("span")).toHaveTextContent(
                "splitbill",
            );
        });
    });
});
