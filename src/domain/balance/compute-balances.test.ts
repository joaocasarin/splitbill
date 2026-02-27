import { computeBalances } from "@domain/balance/compute-balances";
import type { Group } from "@domain/group";
import { describe, expect, test } from "vitest";

const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    memberIds: [1, 2, 3],
    expenses: [],
    settlements: [],
};

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

        test("remainder absorbed by first participant", () => {
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
                    },
                ],
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 67 },
                    { memberId: 2, amount: -34 },
                    { memberId: 3, amount: -33 },
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

        test("rounding remainder absorbed by first participant", () => {
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
                    },
                ],
            });

            expect(balances).toEqual(
                expect.arrayContaining([
                    { memberId: 1, amount: 67 },
                    { memberId: 2, amount: -34 },
                    { memberId: 3, amount: -33 },
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
                    { id: 1, fromMemberId: 2, toMemberId: 1, amount: 50 },
                    { id: 2, fromMemberId: 3, toMemberId: 1, amount: 30 },
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
                    },
                ],
                settlements: [
                    {
                        id: 1,
                        fromMemberId: 2,
                        toMemberId: 1,
                        amount: 100,
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
});
