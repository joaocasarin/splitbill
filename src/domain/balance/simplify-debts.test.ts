import { describe, expect, test } from "vitest";
import type { MemberBalance } from "./balance.schema";
import { simplifyDebts } from "./simplify-debts";

describe("simplifyDebts", () => {
    describe("empty / zero-balance inputs", () => {
        test("returns empty array when all balances are zero", () => {
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 0 },
                { memberId: 2, amount: 0 },
            ];
            expect(simplifyDebts(balances)).toEqual([]);
        });

        test("returns empty array for empty input", () => {
            expect(simplifyDebts([])).toEqual([]);
        });
    });

    describe("single pair", () => {
        test("one debtor and one creditor produces one debt", () => {
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 500 },
                { memberId: 2, amount: -500 },
            ];
            expect(simplifyDebts(balances)).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 500 },
            ]);
        });
    });

    describe("one creditor, multiple debtors", () => {
        test("splits creditor across multiple debtors", () => {
            // Alice is owed 300, Bob owes 200, Carol owes 100
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 300 },
                { memberId: 2, amount: -200 },
                { memberId: 3, amount: -100 },
            ];
            const result = simplifyDebts(balances);
            expect(result).toHaveLength(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 200 },
                    { fromMemberId: 3, toMemberId: 1, amount: 100 },
                ]),
            );
        });
    });

    describe("multiple creditors, one debtor", () => {
        test("splits debtor across multiple creditors", () => {
            // Dave owes 300, Alice is owed 200, Bob is owed 100
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 200 },
                { memberId: 2, amount: 100 },
                { memberId: 3, amount: -300 },
            ];
            const result = simplifyDebts(balances);
            expect(result).toHaveLength(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 3, toMemberId: 1, amount: 200 },
                    { fromMemberId: 3, toMemberId: 2, amount: 100 },
                ]),
            );
        });
    });

    describe("multiple creditors and debtors", () => {
        test("minimizes transactions across a 4-member group", () => {
            // Alice +300, Bob +100, Carol -200, Dave -200
            // Optimal: Carol→Alice 200, Dave→Alice 100, Dave→Bob 100
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 300 },
                { memberId: 2, amount: 100 },
                { memberId: 3, amount: -200 },
                { memberId: 4, amount: -200 },
            ];
            const result = simplifyDebts(balances);
            expect(result).toHaveLength(3);
            expect(result).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 3, toMemberId: 1, amount: 200 },
                    { fromMemberId: 4, toMemberId: 1, amount: 100 },
                    { fromMemberId: 4, toMemberId: 2, amount: 100 },
                ]),
            );
        });

        test("fully balanced group with no net debt returns empty array", () => {
            // A paid for B, B paid for A — net zero
            const balances: MemberBalance[] = [
                { memberId: 1, amount: 0 },
                { memberId: 2, amount: 0 },
                { memberId: 3, amount: 0 },
            ];
            expect(simplifyDebts(balances)).toEqual([]);
        });
    });
});
