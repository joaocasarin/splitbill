import { toast } from "sonner";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { errorClassNames, showToast } from "./toast";

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
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
            });
        });

        test("merges extra options with project classNames", () => {
            const action = { label: "Retry", onClick: vi.fn() };
            showToast.error("something went wrong", { action });

            expect(toast.error).toHaveBeenCalledWith("something went wrong", {
                classNames: errorClassNames,
                action,
            });
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("passes empty options without error", () => {
                expect(() => showToast.error("msg", {})).not.toThrow();
            });
        });
    });
});
