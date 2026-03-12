import {
    BPS_TOTAL,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "@domain/common";
import { describe, expect, test } from "vitest";
import { computeCanSubmit } from "./computeCanSubmit";

const emptyFixed = new Map([
    [1, 0],
    [2, 0],
]);
const emptyPercentage = new Map([
    [1, 0],
    [2, 0],
]);

describe("computeCanSubmit", () => {
    describe("title validation", () => {
        test("false when title is too short", () => {
            expect(
                computeCanSubmit(
                    "Hi",
                    100,
                    1,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("false when title is too long", () => {
            expect(
                computeCanSubmit(
                    "A".repeat(EXPENSE_TITLE_MAX + 1),
                    100,
                    1,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test(`true when title has exactly ${EXPENSE_TITLE_MIN} chars`, () => {
            expect(
                computeCanSubmit(
                    "A".repeat(EXPENSE_TITLE_MIN),
                    100,
                    1,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(true);
        });
    });

    describe("total validation", () => {
        test("false when total is 0", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    0,
                    1,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(false);
        });
    });

    describe("equal split", () => {
        test("false when only payer is participant", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    100,
                    1,
                    "equal",
                    new Set([1]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("true when non-payer participant exists", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    100,
                    1,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(true);
        });
    });

    describe("fixed split", () => {
        test("false when shares do not sum to total", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "fixed",
                    new Set([1]),
                    new Map([
                        [1, 500],
                        [2, 200],
                    ]),
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("false when no non-payer has a share", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "fixed",
                    new Set([1]),
                    new Map([
                        [1, 1000],
                        [2, 0],
                    ]),
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("true when shares sum to total and non-payer has share", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "fixed",
                    new Set([1]),
                    new Map([
                        [1, 600],
                        [2, 400],
                    ]),
                    emptyPercentage,
                ),
            ).toBe(true);
        });
    });

    describe("percentage split", () => {
        test("false when percentages do not sum to 100%", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "percentage",
                    new Set([1]),
                    emptyFixed,
                    new Map([
                        [1, 5000],
                        [2, 3000],
                    ]),
                ),
            ).toBe(false);
        });

        test("false when no non-payer has a percentage", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "percentage",
                    new Set([1]),
                    emptyFixed,
                    new Map([
                        [1, BPS_TOTAL],
                        [2, 0],
                    ]),
                ),
            ).toBe(false);
        });

        test("true when percentages sum to 100% and non-payer has share", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    1,
                    "percentage",
                    new Set([1]),
                    emptyFixed,
                    new Map([
                        [1, 5000],
                        [2, 5000],
                    ]),
                ),
            ).toBe(true);
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("equal split false when payerId is null", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    100,
                    null,
                    "equal",
                    new Set([1, 2]),
                    emptyFixed,
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("fixed split false when payerId is null", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    null,
                    "fixed",
                    new Set([1]),
                    new Map([
                        [1, 600],
                        [2, 400],
                    ]),
                    emptyPercentage,
                ),
            ).toBe(false);
        });

        test("percentage split false when payerId is null", () => {
            expect(
                computeCanSubmit(
                    "Hotel",
                    1000,
                    null,
                    "percentage",
                    new Set([1]),
                    emptyFixed,
                    new Map([
                        [1, 5000],
                        [2, 5000],
                    ]),
                ),
            ).toBe(false);
        });
    });
});
