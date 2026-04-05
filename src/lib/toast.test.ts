import { toast } from "sonner";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { errorClassNames, showToast, successClassNames } from "./toast";

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe("showToast", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("error", () => {
        test("calls toast.error with project classNames", () => {
            showToast.error("something went wrong");

            expect(toast.error).toHaveBeenCalledWith("something went wrong", {
                classNames: errorClassNames,
                duration: 30000,
            });
        });

        test("merges extra options with project classNames", () => {
            const action = { label: "Retry", onClick: vi.fn() };
            showToast.error("something went wrong", { action });

            expect(toast.error).toHaveBeenCalledWith("something went wrong", {
                classNames: errorClassNames,
                duration: 30000,
                action,
            });
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("passes empty options without error", () => {
                expect(() => showToast.error("msg", {})).not.toThrow();
            });
        });
    });

    describe("success", () => {
        test("calls toast.success with project classNames", () => {
            showToast.success("file imported successfully");

            expect(toast.success).toHaveBeenCalledWith(
                "file imported successfully",
                { classNames: successClassNames, duration: 10000 },
            );
        });

        test("merges extra options with project classNames", () => {
            const action = { label: "View", onClick: vi.fn() };
            showToast.success("file imported successfully", { action });

            expect(toast.success).toHaveBeenCalledWith(
                "file imported successfully",
                { classNames: successClassNames, duration: 10000, action },
            );
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("passes empty options without error", () => {
                expect(() => showToast.success("msg", {})).not.toThrow();
            });
        });
    });
});
