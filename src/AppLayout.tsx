import type { ReactNode } from "react";

type Props = {
    sidebar: ReactNode;
    children: ReactNode;
};

export function AppLayout({ children, sidebar }: Props) {
    return (
        <div className="min-h-screen text-foreground flex flex-col">
            <header className="bg-primary text-primary-foreground h-14 px-4 flex items-center gap-3 shrink-0 shadow-sm">
                <span className="font-semibold text-base tracking-tight">
                    Splitbill
                </span>

                <span className="text-primary-foreground/60 text-sm hidden md:block">
                    Split expenses with friends, no backend needed.
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
        </div>
    );
}
