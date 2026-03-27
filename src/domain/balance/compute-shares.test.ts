import { describe, expect, test } from "vitest";
import { computeEqualShares } from "./compute-shares";

describe("computeEqualShares", () => {
    describe("exact division", () => {
        test("splits evenly when total is divisible by participant count", () => {
            const shares = computeEqualShares([1, 2, 3], 300, 1);

            expect(Object.fromEntries(shares)).toEqual({
                1: 100,
                2: 100,
                3: 100,
            });
        });
    });

    describe("remainder distribution", () => {
        test("payer absorbs the first remainder cent when participant", () => {
            const shares = computeEqualShares([1, 2, 3], 100, 1);

            expect(Object.fromEntries(shares)).toEqual({
                1: 34,
                2: 33,
                3: 33,
            });
        });

        test("payer absorbs first cent, non-payers absorb the rest in order (remainder > 1)", () => {
            const shares = computeEqualShares([1, 2, 3], 200, 1);

            expect(Object.fromEntries(shares)).toEqual({
                1: 67,
                2: 67,
                3: 66,
            });
        });

        test("first non-payer absorbs remainder when payer is not a participant", () => {
            const shares = computeEqualShares([2, 3, 4], 100, 1);

            expect(Object.fromEntries(shares)).toEqual({
                2: 34,
                3: 33,
                4: 33,
            });
        });

        test("non-payers absorb all remainder cents in order when payer is not a participant (remainder > 1)", () => {
            const shares = computeEqualShares([2, 3, 4], 200, 1);

            expect(Object.fromEntries(shares)).toEqual({
                2: 67,
                3: 67,
                4: 66,
            });
        });
    });

    describe("invariant", () => {
        test("sum of shares always equals total", () => {
            const cases = [
                { memberIds: [1, 2, 3], total: 100, payerId: 1 },
                { memberIds: [1, 2, 3], total: 200, payerId: 1 },
                { memberIds: [1, 2, 3], total: 301, payerId: 1 },
                { memberIds: [2, 3, 4], total: 100, payerId: 1 },
                { memberIds: [1, 2], total: 99, payerId: 1 },
            ] as const;

            for (const { memberIds, total, payerId } of cases) {
                const shares = computeEqualShares(
                    [...memberIds],
                    total,
                    payerId,
                );
                const sum = Array.from(shares.values()).reduce(
                    (a, b) => a + b,
                    0,
                );
                expect(sum).toBe(total);
            }
        });
    });
});
