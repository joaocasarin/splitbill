import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { AppLayout } from "./AppLayout";

vi.mock("@components/AppLogo", () => ({
    AppLogo: () => <div data-testid="app-logo" />,
}));

const defaultProps = {
    isSidebarOpen: false,
    onToggleSidebar: vi.fn(),
    onCloseSidebar: vi.fn(),
};

describe("AppLayout", () => {
    test("renders brand name via AppLogo", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(screen.getByTestId("app-logo")).toBeInTheDocument();
    });

    test("renders tagline", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByText(/split the bill, not the friendship./i),
        ).toBeInTheDocument();
    });

    test("renders sidebar content", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div>sidebar content</div>}>
                <div />
            </AppLayout>,
        );
        expect(screen.getByText("sidebar content")).toBeInTheDocument();
    });

    test("renders children content", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div>main content</div>
            </AppLayout>,
        );
        expect(screen.getByText("main content")).toBeInTheDocument();
    });

    test("renders burger button", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByRole("button", { name: /toggle sidebar/i }),
        ).toBeInTheDocument();
    });

    test("calls onToggleSidebar when burger button is clicked", async () => {
        const onToggleSidebar = vi.fn();
        render(
            <AppLayout
                {...defaultProps}
                onToggleSidebar={onToggleSidebar}
                sidebar={<div />}
            >
                <div />
            </AppLayout>,
        );
        await userEvent.click(
            screen.getByRole("button", { name: /toggle sidebar/i }),
        );
        expect(onToggleSidebar).toHaveBeenCalledOnce();
    });

    test("does not render mobile drawer when sidebar is closed", () => {
        render(
            <AppLayout
                {...defaultProps}
                isSidebarOpen={false}
                sidebar={<div>drawer content</div>}
            >
                <div />
            </AppLayout>,
        );
        expect(
            screen.queryByRole("button", { name: /close sidebar/i }),
        ).not.toBeInTheDocument();
    });

    test("renders mobile drawer when sidebar is open", () => {
        render(
            <AppLayout {...defaultProps} isSidebarOpen={true} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByRole("button", { name: /close sidebar/i }),
        ).toBeInTheDocument();
    });

    test("renders copyright link in footer", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByRole("link", { name: /github user/i }),
        ).toHaveAttribute("href", "https://github.com/joaocasarin");
        expect(screen.getByText(/© 2025 João Casarin/i)).toBeInTheDocument();
    });

    test("renders GitHub link in footer", () => {
        render(
            <AppLayout {...defaultProps} sidebar={<div />}>
                <div />
            </AppLayout>,
        );
        expect(
            screen.getByRole("link", { name: /github repository/i }),
        ).toHaveAttribute("href", "https://github.com/joaocasarin/splitbill");
    });

    describe("logo navigation", () => {
        test("renders logo as a button when onNavigateHome is provided", () => {
            render(
                <AppLayout
                    {...defaultProps}
                    onNavigateHome={vi.fn()}
                    sidebar={<div />}
                >
                    <div />
                </AppLayout>,
            );
            expect(
                screen.getByRole("button", { name: /go to home/i }),
            ).toBeInTheDocument();
        });

        test("calls onNavigateHome when logo button is clicked", async () => {
            const onNavigateHome = vi.fn();
            render(
                <AppLayout
                    {...defaultProps}
                    onNavigateHome={onNavigateHome}
                    sidebar={<div />}
                >
                    <div />
                </AppLayout>,
            );
            await userEvent.click(
                screen.getByRole("button", { name: /go to home/i }),
            );
            expect(onNavigateHome).toHaveBeenCalledOnce();
        });

        test("does not render logo as a button when onNavigateHome is omitted", () => {
            render(
                <AppLayout {...defaultProps} sidebar={<div />}>
                    <div />
                </AppLayout>,
            );
            expect(
                screen.queryByRole("button", { name: /go to home/i }),
            ).not.toBeInTheDocument();
        });
    });

    test("calls onCloseSidebar when backdrop is clicked", async () => {
        const onCloseSidebar = vi.fn();
        render(
            <AppLayout
                {...defaultProps}
                isSidebarOpen={true}
                onCloseSidebar={onCloseSidebar}
                sidebar={<div />}
            >
                <div />
            </AppLayout>,
        );
        await userEvent.click(
            screen.getByRole("button", { name: /close sidebar/i }),
        );
        expect(onCloseSidebar).toHaveBeenCalledOnce();
    });
});
