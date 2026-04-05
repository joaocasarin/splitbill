import type { ExternalToast } from "sonner";
import { toast } from "sonner";

export const errorClassNames = {
    toast: "!bg-red-50 !border-red-200",
    title: "!text-red-600",
    icon: "!text-red-600",
    actionButton: "!bg-red-700 !text-white",
};

export const showToast = {
    error: (message: string, options?: ExternalToast) =>
        toast.error(message, { classNames: errorClassNames, ...options }),
};
