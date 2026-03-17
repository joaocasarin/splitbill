import type { Expense } from "@domain/expense";
import { testUsers } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { getInitialExpenseState } from "./getInitialExpenseState";

const members = testUsers;

describe("getInitialExpenseState", () => {
    describe("create mode (no expense)", () => {
        test("title is empty string", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.title).toBe("");
        });

        test("total is 0", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.total).toBe(0);
        });

        test("payerId is firstMemberId", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.payerId).toBe(1);
        });

        test("splitMode is equal", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.splitMode).toBe("equal");
        });

        test("participantIds contains firstMemberId", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.participantIds).toEqual(new Set([1]));
        });

        test("participantIds is empty when firstMemberId is null", () => {
            const state = getInitialExpenseState([], null);
            expect(state.participantIds).toEqual(new Set());
        });

        test("fixedShares initialized to 0 for each member", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.fixedShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });

        test("percentageShares initialized to 0 for each member", () => {
            const state = getInitialExpenseState(members, 1);
            expect(state.percentageShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });
    });

    describe("edit mode — equal expense", () => {
        const equalExpense: Expense = {
            id: 1,
            title: "Hotel",
            total: 10000,
            payerId: 1,
            splitMode: "equal",
            memberIds: [1, 2],
            createdAt: 1000000,
        };

        test("pre-fills title from expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.title).toBe("Hotel");
        });

        test("pre-fills total from expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.total).toBe(10000);
        });

        test("pre-fills payerId from expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.payerId).toBe(1);
        });

        test("pre-fills splitMode from expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.splitMode).toBe("equal");
        });

        test("pre-fills participantIds from expense memberIds", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.participantIds).toEqual(new Set([1, 2]));
        });

        test("fixedShares default to 0 for equal expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.fixedShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });

        test("percentageShares default to 0 for equal expense", () => {
            const state = getInitialExpenseState(members, 1, equalExpense);
            expect(state.percentageShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });
    });

    describe("edit mode — fixed expense", () => {
        const fixedExpense: Expense = {
            id: 2,
            title: "Dinner",
            total: 5000,
            payerId: 1,
            splitMode: "fixed",
            shares: [
                { memberId: 1, value: 3000 },
                { memberId: 2, value: 2000 },
            ],
            createdAt: 1000000,
        };

        test("pre-fills fixedShares from expense shares", () => {
            const state = getInitialExpenseState(members, 1, fixedExpense);
            expect(state.fixedShares).toEqual(
                new Map([
                    [1, 3000],
                    [2, 2000],
                ]),
            );
        });

        test("participantIds defaults for fixed expense", () => {
            const state = getInitialExpenseState(members, 1, fixedExpense);
            expect(state.participantIds).toEqual(new Set([1]));
        });

        test("percentageShares default to 0 for fixed expense", () => {
            const state = getInitialExpenseState(members, 1, fixedExpense);
            expect(state.percentageShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });
    });

    describe("edit mode — percentage expense", () => {
        const percentageExpense: Expense = {
            id: 3,
            title: "Taxi",
            total: 2000,
            payerId: 2,
            splitMode: "percentage",
            shares: [
                { memberId: 1, value: 6000 },
                { memberId: 2, value: 4000 },
            ],
            createdAt: 1000000,
        };

        test("pre-fills percentageShares from expense shares", () => {
            const state = getInitialExpenseState(members, 1, percentageExpense);
            expect(state.percentageShares).toEqual(
                new Map([
                    [1, 6000],
                    [2, 4000],
                ]),
            );
        });

        test("fixedShares default to 0 for percentage expense", () => {
            const state = getInitialExpenseState(members, 1, percentageExpense);
            expect(state.fixedShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });

        test("participantIds defaults for percentage expense", () => {
            const state = getInitialExpenseState(members, 1, percentageExpense);
            expect(state.participantIds).toEqual(new Set([1]));
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("participantIds empty when firstMemberId null and non-equal expense", () => {
            const fixedExpense: Expense = {
                id: 2,
                title: "Dinner",
                total: 5000,
                payerId: 1,
                splitMode: "fixed",
                shares: [
                    { memberId: 1, value: 3000 },
                    { memberId: 2, value: 2000 },
                ],
                createdAt: 1000000,
            };
            const state = getInitialExpenseState([], null, fixedExpense);
            expect(state.participantIds).toEqual(new Set());
        });
    });
});
