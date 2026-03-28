import { baseGroup } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { computeDirectDebts } from "./compute-direct-debts";

describe("computeDirectDebts", () => {
    describe("equal split", () => {
        test("returns direct debts from non-payers to payer", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 300,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 100 },
                    { fromMemberId: 3, toMemberId: 1, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(2);
        });

        test("remainder absorbed by payer — non-payers owe base share only", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 33 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                ]),
            );
        });

        test("remainder goes to first participant when payer is not in memberIds", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [2, 3, 4],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 34 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                    { fromMemberId: 4, toMemberId: 1, amount: 33 },
                ]),
            );
            expect(debts).toHaveLength(3);
        });

        test("payer not in memberIds generates no self-debt", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [2, 3],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 100 },
                    { fromMemberId: 3, toMemberId: 1, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(2);
        });
    });

    describe("fixed split", () => {
        test("returns direct debts from shares", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 300,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [
                            { memberId: 1, value: 100 },
                            { memberId: 2, value: 100 },
                            { memberId: 3, value: 100 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 100 },
                    { fromMemberId: 3, toMemberId: 1, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(2);
        });

        test("payer not in shares generates no self-debt", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [
                            { memberId: 2, value: 100 },
                            { memberId: 3, value: 100 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 100 },
                    { fromMemberId: 3, toMemberId: 1, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(2);
        });
    });

    describe("percentage split", () => {
        test("returns direct debts from shares", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "percentage",
                        shares: [
                            { memberId: 1, value: 5000 },
                            { memberId: 2, value: 5000 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(1);
        });

        test("remainder absorbed by payer — non-payers owe base amount only", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "percentage",
                        shares: [
                            { memberId: 1, value: 3334 },
                            { memberId: 2, value: 3333 },
                            { memberId: 3, value: 3333 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 33 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                ]),
            );
        });

        test("remainder goes to first participant when payer is not in shares", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                members: [
                    { id: 1, name: "Alice", createdAt: 1000000 },
                    { id: 2, name: "Bob", createdAt: 1000000 },
                    { id: 3, name: "Carol", createdAt: 1000000 },
                    { id: 4, name: "Dave", createdAt: 1000000 },
                ],
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "percentage",
                        shares: [
                            { memberId: 2, value: 3333 },
                            { memberId: 3, value: 3333 },
                            { memberId: 4, value: 3334 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 34 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                    { fromMemberId: 4, toMemberId: 1, amount: 33 },
                ]),
            );
            expect(debts).toHaveLength(3);
        });
    });

    describe("settlements", () => {
        test("settlement reduces direct debt", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2],
                        createdAt: 1000000,
                    },
                ],
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 2,
                        toMemberId: 1,
                        amount: 50,
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 50 },
                ]),
            );
        });

        test("cross-path settlement creates reverse credit", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 200 }],
                        createdAt: 1000000,
                    },
                ],
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 3,
                        toMemberId: 1,
                        amount: 100,
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 200 },
                    { fromMemberId: 1, toMemberId: 3, amount: 100 },
                ]),
            );
            expect(debts).toHaveLength(2);
        });

        test("overpayment on direct path creates reverse credit", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 200 }],
                        createdAt: 1000000,
                    },
                ],
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 2,
                        toMemberId: 1,
                        amount: 250,
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual([
                { fromMemberId: 1, toMemberId: 2, amount: 50 },
            ]);
        });

        test("settlement that fully pays debt removes it from result", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2],
                        createdAt: 1000000,
                    },
                ],
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 2,
                        toMemberId: 1,
                        amount: 100,
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toHaveLength(0);
        });
    });

    describe("empty group", () => {
        test("returns empty array", () => {
            const debts = computeDirectDebts(baseGroup);
            expect(debts).toHaveLength(0);
        });
    });

    describe("netting", () => {
        test("nets cross-debts between two members (partial: only net debtor shown)", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 5250,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 5250 }],
                        createdAt: 1000000,
                    },
                    {
                        id: 2,
                        title: "Coffee",
                        total: 500,
                        payerId: 2,
                        splitMode: "fixed",
                        shares: [{ memberId: 1, value: 500 }],
                        createdAt: 1000001,
                    },
                ],
            });

            expect(debts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 4750 },
            ]);
        });

        test("nets to zero when debts cancel exactly", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 1000,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 1000 }],
                        createdAt: 1000000,
                    },
                    {
                        id: 2,
                        title: "Lunch",
                        total: 1000,
                        payerId: 2,
                        splitMode: "fixed",
                        shares: [{ memberId: 1, value: 1000 }],
                        createdAt: 1000001,
                    },
                ],
            });

            expect(debts).toHaveLength(0);
        });

        test("nets correctly when smaller debt is iterated before larger reverse debt", () => {
            // Expense 1 creates key "1-2" first (small), Expense 2 creates "2-1" (large).
            // When the loop hits "1-2" first, reverseAmount > amount → else branch (skip).
            // When the loop hits "2-1", it handles the netting.
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Coffee",
                        total: 500,
                        payerId: 2,
                        splitMode: "fixed",
                        shares: [{ memberId: 1, value: 500 }],
                        createdAt: 1000000,
                    },
                    {
                        id: 2,
                        title: "Dinner",
                        total: 5250,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 5250 }],
                        createdAt: 1000001,
                    },
                ],
            });

            expect(debts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 4750 },
            ]);
        });

        test("does not affect debts with no reverse counterpart", () => {
            const debts = computeDirectDebts({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 2000,
                        payerId: 1,
                        splitMode: "fixed",
                        shares: [{ memberId: 2, value: 2000 }],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(debts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 2000 },
            ]);
        });
    });
});
