import { describe, expect, test } from "vitest";
import { buildPercentageExpense } from "./build-percentage-expense";

describe("buildPercentageExpense", () => {
    describe("valid input", () => {
        test("returns expense object when payerId is valid", () => {
            const result = buildPercentageExpense(
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
                splitMode: "percentage",
                shares: expect.arrayContaining([
                    { memberId: 1, value: 6000 },
                    { memberId: 2, value: 4000 },
                ]),
            });
        });

        test("trims title whitespace", () => {
            const result = buildPercentageExpense(
                "  Hotel  ",
                10000,
                1,
                new Map([[2, 10000]]),
            );
            expect(result?.title).toBe("Hotel");
        });

        test("converts shares Map to array of { memberId, value }", () => {
            const result = buildPercentageExpense(
                "Hotel",
                9000,
                1,
                new Map([
                    [1, 3334],
                    [2, 3333],
                    [3, 3333],
                ]),
            );
            expect(result?.shares).toHaveLength(3);
            expect(result?.shares).toEqual(
                expect.arrayContaining([
                    { memberId: 1, value: 3334 },
                    { memberId: 2, value: 3333 },
                    { memberId: 3, value: 3333 },
                ]),
            );
        });

        test("sets splitMode to percentage", () => {
            const result = buildPercentageExpense(
                "Hotel",
                10000,
                1,
                new Map([[2, 10000]]),
            );
            expect(result?.splitMode).toBe("percentage");
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("returns null when payerId is null", () => {
            expect(
                buildPercentageExpense(
                    "Hotel",
                    10000,
                    null,
                    new Map([[2, 10000]]),
                ),
            ).toBeNull();
        });
    });
});
