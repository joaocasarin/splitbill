import {
    ERROR_TOAST_DURATION_SECONDS,
    SUCCESS_TOAST_DURATION_SECONDS,
} from "@common/constants";
import type { ExternalToast } from "sonner";
import { toast } from "sonner";

export const errorClassNames = {
    toast: "!bg-red-50 !border-red-200",
    title: "!text-red-600",
    icon: "!text-red-600",
    actionButton: "!bg-red-700 !text-white",
    closeButton: "!bg-red-50 !border-red-200 !text-red-600 hover:!bg-red-200",
};

export const successClassNames = {
    toast: "!bg-green-50 !border-green-200",
    title: "!text-green-700",
    icon: "!text-green-600",
    closeButton:
        "!bg-green-50 !border-green-200 !text-green-600 hover:!bg-green-100",
};

export const showToast = {
    error: (message: string, options?: ExternalToast) =>
        toast.error(message, {
            classNames: errorClassNames,
            duration: ERROR_TOAST_DURATION_SECONDS,
            ...options,
        }),
    success: (message: string, options?: ExternalToast) =>
        toast.success(message, {
            classNames: successClassNames,
            duration: SUCCESS_TOAST_DURATION_SECONDS,
            ...options,
        }),
};
