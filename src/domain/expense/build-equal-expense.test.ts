import { describe, expect, test } from "vitest";
import { buildEqualExpense } from "./build-equal-expense";

describe("buildEqualExpense", () => {
    describe("valid input", () => {
        test("returns expense object when payerId is valid", () => {
            const result = buildEqualExpense("Hotel", 100, 1, new Set([1, 2]));
            expect(result).toEqual({
                title: "Hotel",
                total: 100,
                payerId: 1,
                splitMode: "equal",
                memberIds: expect.arrayContaining([1, 2]),
            });
        });

        test("trims title whitespace", () => {
            const result = buildEqualExpense(
                "  Hotel  ",
                100,
                1,
                new Set([1, 2]),
            );
            expect(result?.title).toBe("Hotel");
        });

        test("converts participantIds Set to memberIds array", () => {
            const result = buildEqualExpense(
                "Hotel",
                100,
                1,
                new Set([1, 2, 3]),
            );
            expect(result?.memberIds).toHaveLength(3);
            expect(result?.memberIds).toContain(1);
            expect(result?.memberIds).toContain(2);
            expect(result?.memberIds).toContain(3);
        });

        test("sets splitMode to equal", () => {
            const result = buildEqualExpense("Hotel", 100, 1, new Set([1, 2]));
            expect(result?.splitMode).toBe("equal");
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("returns null when payerId is null", () => {
            expect(
                buildEqualExpense("Hotel", 100, null, new Set([1, 2])),
            ).toBeNull();
        });
    });
});
