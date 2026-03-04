import type { ReactNode } from "react";

export const Dialog = ({
    onOpenChange,
    open,
    children,
}: {
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    children?: ReactNode;
}) => (
    <>
        <button
            type="button"
            data-testid="__dialog_open__"
            onClick={() => onOpenChange?.(true)}
        />
        {open ? children : null}
    </>
);

export const DialogContent = ({ children }: { children?: ReactNode }) => (
    <div role="dialog">{children}</div>
);

export const DialogHeader = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
);

export const DialogTitle = ({ children }: { children?: ReactNode }) => (
    <h2>{children}</h2>
);

export const DialogFooter = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
);
