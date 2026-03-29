import { AppLogo } from "@components/AppLogo";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { siGithub } from "simple-icons";

type Props = {
    sidebar: ReactNode;
    children: ReactNode;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCloseSidebar: () => void;
    onNavigateHome?: () => void;
};

export function AppLayout({
    children,
    isSidebarOpen,
    onCloseSidebar,
    onToggleSidebar,
    onNavigateHome,
    sidebar,
}: Props) {
    return (
        <div className="min-h-screen bg-muted/40 text-foreground flex flex-col">
            <header className="bg-primary text-primary-foreground h-14 px-4 flex items-center gap-3 shrink-0 shadow-sm">
                {/* Burger button — mobile only */}
                <button
                    type="button"
                    className="md:hidden p-1.5 rounded-md hover:bg-primary-foreground/10 active:bg-primary-foreground/20 transition-colors cursor-pointer"
                    onClick={() => onToggleSidebar()}
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </button>

                {onNavigateHome ? (
                    <button
                        type="button"
                        aria-label="Go to home"
                        onClick={onNavigateHome}
                        className="cursor-pointer rounded-md hover:opacity-80 transition-opacity"
                    >
                        <AppLogo
                            background="none"
                            foreground="primary"
                            label="splitbill"
                        />
                    </button>
                ) : (
                    <AppLogo
                        background="none"
                        foreground="primary"
                        label="splitbill"
                    />
                )}

                <span className="text-primary-foreground/60 text-sm hidden md:block">
                    Split the bill, not the friendship.
                </span>
            </header>

            <div className="flex flex-1 overflow-hidden max-w-5xl mx-auto w-full bg-background shadow-sm">
                {/* Sidebar — always visible on desktop */}
                <aside className="hidden md:block w-60 shrink-0 border-r border-border overflow-y-auto">
                    {sidebar}
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>

            <footer className="py-2 px-4 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border bg-background shrink-0">
                <a
                    href="https://github.com/joaocasarin"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub user"
                    className="hover:text-foreground transition-colors"
                >
                    <span>© 2025 João Casarin</span>
                </a>
                <a
                    href="https://github.com/joaocasarin/splitbill"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub repository"
                    className="hover:text-foreground transition-colors"
                >
                    <svg
                        role="img"
                        viewBox="0 0 24 24"
                        className="w-3 h-3 fill-current"
                    >
                        <title>GitHub</title>
                        <path d={siGithub.path} />
                    </svg>
                </a>
            </footer>

            {/* Mobile sidebar overlay */}
            {isSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <button
                        type="button"
                        className="md:hidden fixed inset-0 z-40 bg-black/40 cursor-default"
                        onClick={() => onCloseSidebar()}
                        aria-label="Close sidebar"
                    />

                    {/* Drawer */}
                    <aside className="md:hidden fixed top-14 left-0 bottom-0 z-50 w-72 bg-background border-r border-border overflow-y-auto shadow-xl">
                        {sidebar}
                    </aside>
                </>
            )}
        </div>
    );
}
