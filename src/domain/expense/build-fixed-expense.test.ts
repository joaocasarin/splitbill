import { describe, expect, test } from "vitest";
import { buildFixedExpense } from "./build-fixed-expense";

describe("buildFixedExpense", () => {
    describe("valid input", () => {
        test("returns expense object when payerId is valid", () => {
            const result = buildFixedExpense(
                "Hotel",
                10000,
                1,
                new Map([
                    [1, 6000],
                    [2, 4000],
                ]),
            );
            expect(result).toEqual({
                title: "Hotel",
                total: 10000,
                payerId: 1,
                splitMode: "fixed",
                shares: expect.arrayContaining([
                    { memberId: 1, value: 6000 },
                    { memberId: 2, value: 4000 },
                ]),
            });
        });

        test("trims title whitespace", () => {
            const result = buildFixedExpense(
                "  Hotel  ",
                10000,
                1,
                new Map([[2, 10000]]),
            );
            expect(result?.title).toBe("Hotel");
        });

        test("converts shares Map to array of { memberId, value }", () => {
            const result = buildFixedExpense(
                "Hotel",
                9000,
                1,
                new Map([
                    [1, 3000],
                    [2, 3000],
                    [3, 3000],
                ]),
            );
            expect(result?.shares).toHaveLength(3);
            expect(result?.shares).toEqual(
                expect.arrayContaining([
                    { memberId: 1, value: 3000 },
                    { memberId: 2, value: 3000 },
                    { memberId: 3, value: 3000 },
                ]),
            );
        });

        test("sets splitMode to fixed", () => {
            const result = buildFixedExpense(
                "Hotel",
                10000,
                1,
                new Map([[2, 10000]]),
            );
            expect(result?.splitMode).toBe("fixed");
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("returns null when payerId is null", () => {
            expect(
                buildFixedExpense("Hotel", 10000, null, new Map([[2, 10000]])),
            ).toBeNull();
        });
    });
});
