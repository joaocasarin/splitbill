import type { ExternalToast } from "sonner";
import { toast } from "sonner";

export const errorClassNames = {
    toast: "!bg-red-50 !border-red-200",
    title: "!text-red-600",
    icon: "!text-red-600",
    actionButton: "!bg-red-700 !text-white",
    closeButton: "!bg-red-50 !border-red-200 !text-red-600 hover:!bg-red-200",
};

export const showToast = {
    error: (message: string, options?: ExternalToast) =>
        toast.error(message, { classNames: errorClassNames, ...options }),
};
