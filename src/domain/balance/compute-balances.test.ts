import { baseGroup } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { computeBalances } from "../balance";

describe("computeBalances", () => {
    describe("equal split", () => {
        test("splits evenly with no remainder", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 200 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: -100 },
                ]),
            );
        });

        test("payer absorbs the first remainder cent, then non-payers in order", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 66 },
                    { memberId: 2, amount: -33 },
                    { memberId: 3, amount: -33 },
                ]),
            );
        });

        test("distributes remainder > 1: payer absorbs first cent, non-payers absorb the rest in order", () => {
            const balances = computeBalances({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                ],
            });

            // baseShare=66, remainder=2 → payer(1) absorbs 1, member2 absorbs 1
            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 133 },
                    { memberId: 2, amount: -67 },
                    { memberId: 3, amount: -66 },
                ]),
            );
        });

        test("remainder absorbed by first participant when payer is not a participant", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 100 },
                    { memberId: 2, amount: -34 },
                    { memberId: 3, amount: -33 },
                    { memberId: 4, amount: -33 },
                ]),
            );
        });

        test("payer is not a participant", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 200 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: -100 },
                ]),
            );
        });

        test("payer is a participant", () => {
            const balances = computeBalances({
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
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 100 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: 0 },
                ]),
            );
        });
    });

    describe("fixed split", () => {
        test("applies shares directly", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 200 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: -100 },
                ]),
            );
        });

        test("payer is not in shares", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 200 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: -100 },
                ]),
            );
        });
    });

    describe("percentage split", () => {
        test("splits by percentage with no rounding remainder", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 100 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: 0 },
                ]),
            );
        });

        test("payer absorbs the first rounding remainder cent, then non-payers in order", () => {
            const balances = computeBalances({
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 66 },
                    { memberId: 2, amount: -33 },
                    { memberId: 3, amount: -33 },
                ]),
            );
        });

        test("distributes positive remainder > 1: payer absorbs first cent, non-payers absorb the rest in order", () => {
            const group = {
                ...baseGroup,
                members: [
                    { id: 1, name: "Alice", createdAt: 1000000 },
                    { id: 2, name: "Bob", createdAt: 1000000 },
                    { id: 3, name: "Carol", createdAt: 1000000 },
                    { id: 4, name: "Dave", createdAt: 1000000 },
                    { id: 5, name: "Eve", createdAt: 1000000 },
                ],
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "percentage" as const,
                        // round(20.49)=20 (×4), round(18.04)=18 → sum=98, remainder=+2
                        shares: [
                            { memberId: 1, value: 2049 },
                            { memberId: 2, value: 2049 },
                            { memberId: 3, value: 2049 },
                            { memberId: 4, value: 2049 },
                            { memberId: 5, value: 1804 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            };

            const balances = computeBalances(group);

            // payer(1) absorbs 1 → +79; member2 absorbs 1 → -21; rest unchanged
            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 79 },
                    { memberId: 2, amount: -21 },
                    { memberId: 3, amount: -20 },
                    { memberId: 4, amount: -20 },
                    { memberId: 5, amount: -18 },
                ]),
            );
        });

        test("distributes negative remainder: payer absorbs first cent back, non-payers absorb the rest in order", () => {
            const group = {
                ...baseGroup,
                members: [
                    { id: 1, name: "Alice", createdAt: 1000000 },
                    { id: 2, name: "Bob", createdAt: 1000000 },
                    { id: 3, name: "Carol", createdAt: 1000000 },
                    { id: 4, name: "Dave", createdAt: 1000000 },
                    { id: 5, name: "Eve", createdAt: 1000000 },
                    { id: 6, name: "Frank", createdAt: 1000000 },
                ],
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 100,
                        payerId: 1,
                        splitMode: "percentage" as const,
                        // round(16.67)=17 (×4), round(16.66)=17 (×2) → sum=102, remainder=-2
                        shares: [
                            { memberId: 1, value: 1667 },
                            { memberId: 2, value: 1667 },
                            { memberId: 3, value: 1667 },
                            { memberId: 4, value: 1667 },
                            { memberId: 5, value: 1666 },
                            { memberId: 6, value: 1666 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            };

            const balances = computeBalances(group);

            // payer(1) gets +1 back → +84; member2 gets +1 back → -16; rest unchanged
            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 84 },
                    { memberId: 2, amount: -16 },
                    { memberId: 3, amount: -17 },
                    { memberId: 4, amount: -17 },
                    { memberId: 5, amount: -17 },
                    { memberId: 6, amount: -17 },
                ]),
            );
        });

        test("payer is not in shares", () => {
            const balances = computeBalances({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Dinner",
                        total: 200,
                        payerId: 1,
                        splitMode: "percentage",
                        shares: [
                            { memberId: 2, value: 5000 },
                            { memberId: 3, value: 5000 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 200 },
                    { memberId: 2, amount: -100 },
                    { memberId: 3, amount: -100 },
                ]),
            );
        });

        test("remainder goes to first participant when payer is not in shares", () => {
            const group = {
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
                        splitMode: "percentage" as const,
                        shares: [
                            { memberId: 2, value: 3333 },
                            { memberId: 3, value: 3333 },
                            { memberId: 4, value: 3334 },
                        ],
                        createdAt: 1000000,
                    },
                ],
            };

            const balances = computeBalances(group);

            // round(100*3333/10000)=33, round(100*3333/10000)=33, round(100*3334/10000)=33
            // sum=99, remainder=1 → goes to first participant (member 2)
            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 100 },
                    { memberId: 2, amount: -34 },
                    { memberId: 3, amount: -33 },
                    { memberId: 4, amount: -33 },
                ]),
            );
        });
    });

    describe("settlements", () => {
        test("settlement reduces debt between two members", () => {
            const balances = computeBalances({
                ...baseGroup,
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

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: -50 },
                    { memberId: 2, amount: 50 },
                    { memberId: 3, amount: 0 },
                ]),
            );
        });

        test("multiple settlements accumulate correctly", () => {
            const balances = computeBalances({
                ...baseGroup,
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 2,
                        toMemberId: 1,
                        amount: 50,
                        createdAt: 1000000,
                    },
                    {
                        id: 2,
                        fromMemberId: 3,
                        toMemberId: 1,
                        amount: 30,
                        createdAt: 1000000,
                    },
                ],
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: -80 },
                    { memberId: 2, amount: 50 },
                    { memberId: 3, amount: 30 },
                ]),
            );
        });
    });

    describe("symmetric expenses cancel out", () => {
        test("three members each paying equal expense results in zero balances", () => {
            const balances = computeBalances({
                ...baseGroup,
                expenses: [
                    {
                        id: 1,
                        title: "Expense 1",
                        total: 1000,
                        payerId: 1,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                    {
                        id: 2,
                        title: "Expense 2",
                        total: 1000,
                        payerId: 2,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                    {
                        id: 3,
                        title: "Expense 3",
                        total: 1000,
                        payerId: 3,
                        splitMode: "equal",
                        memberIds: [1, 2, 3],
                        createdAt: 1000000,
                    },
                ],
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 0 },
                    { memberId: 2, amount: 0 },
                    { memberId: 3, amount: 0 },
                ]),
            );
        });
    });

    describe("invariant: sum of balances is always 0", () => {
        test("equal split", () => {
            const balances = computeBalances({
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
            const sum = balances.reduce((acc, b) => acc + b.amount, 0);
            expect(sum).toBe(0);
        });

        test("percentage split with rounding", () => {
            const balances = computeBalances({
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
            const sum = balances.reduce((acc, b) => acc + b.amount, 0);
            expect(sum).toBe(0);
        });

        test("expenses and settlements combined", () => {
            const balances = computeBalances({
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
            const sum = balances.reduce((acc, b) => acc + b.amount, 0);
            expect(sum).toBe(0);
        });
    });

    describe("empty group", () => {
        test("returns zero balance for all members", () => {
            const balances = computeBalances(baseGroup);
            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 0 },
                    { memberId: 2, amount: 0 },
                    { memberId: 3, amount: 0 },
                ]),
            );
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to 0 when memberId is not in initialized balances", () => {
            const balances = computeBalances({
                ...baseGroup,
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 999,
                        toMemberId: 1,
                        amount: 50,
                        createdAt: 1000000,
                    },
                ],
            });
            const member999 = balances.find((b) => b.memberId === 999);
            expect(member999?.amount).toBe(50);
        });

        describe("equal split", () => {
            test("duplicate memberIds are collapsed by Map — remainder absorbed by payer", () => {
                const balances = computeBalances({
                    ...baseGroup,
                    expenses: [
                        {
                            id: 1,
                            title: "Dinner",
                            total: 3,
                            payerId: 1,
                            splitMode: "equal",
                            // Invalid data by design: duplicates are collapsed by
                            // computeEqualShares Map, so only 1 share is computed
                            // instead of 2. Payment (+3) minus share (-2) = +1.
                            memberIds: [1, 1],
                            createdAt: 1000000,
                        },
                    ],
                });

                const member1 = balances.find((b) => b.memberId === 1);
                expect(member1?.amount).toBe(1);
            });
        });

        describe("percentage split", () => {
            test("duplicate shares are collapsed by Map — only last base amount kept", () => {
                const balances = computeBalances({
                    ...baseGroup,
                    expenses: [
                        {
                            id: 1,
                            title: "Dinner",
                            total: 100,
                            payerId: 1,
                            splitMode: "percentage",
                            // Invalid data by design: duplicates are collapsed by
                            // computePercentageShares Map, so only 1 share is kept
                            // instead of 3. Payment (+100) minus share (-34) = +66.
                            shares: [
                                { memberId: 1, value: 3334 },
                                { memberId: 1, value: 3333 },
                                { memberId: 1, value: 3333 },
                            ],
                            createdAt: 1000000,
                        },
                    ],
                });

                const member1 = balances.find((b) => b.memberId === 1);
                expect(member1?.amount).toBe(66);
            });
        });
    });
});
