import type { Group } from "@domain/group";
import { describe, expect, test } from "vitest";
import { computeDirectDebts } from "./compute-direct-debts";

const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    memberIds: [1, 2, 3],
    expenses: [],
    settlements: [],
};

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

        test("remainder absorbed by first non-payer", () => {
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
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 34 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                ]),
            );
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

        test("remainder absorbed by first non-payer", () => {
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
                    },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 34 },
                    { fromMemberId: 3, toMemberId: 1, amount: 33 },
                ]),
            );
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
                    },
                ],
                settlements: [
                    { id: 1, fromMemberId: 2, toMemberId: 1, amount: 50 },
                ],
            });

            expect(debts).toEqual(
                expect.arrayContaining([
                    { fromMemberId: 2, toMemberId: 1, amount: 50 },
                ]),
            );
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
                    },
                ],
                settlements: [
                    { id: 1, fromMemberId: 2, toMemberId: 1, amount: 100 },
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
});
