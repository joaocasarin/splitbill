import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    sidebar: ReactNode;
    children: ReactNode;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCloseSidebar: () => void;
};

export function AppLayout({
    children,
    isSidebarOpen,
    onCloseSidebar,
    onToggleSidebar,
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

                <span className="font-semibold text-base tracking-tight">
                    Splitbill
                </span>

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
