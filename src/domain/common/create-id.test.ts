import type { Expense } from "@domain/expense";
import type { Settlement } from "@domain/settlement";
import { emptyGlobal } from "@tests/mocks";
import { beforeEach, describe, expect, test } from "vitest";
import { createIdGenerator } from "./create-id";

describe("createIdGenerator", () => {
    describe("empty state", () => {
        let createId: ReturnType<typeof createIdGenerator>;

        beforeEach(() => {
            createId = createIdGenerator(emptyGlobal);
        });

        test("starts user counter at 1", () => {
            expect(createId("user")).toBe(1);
        });

        test("starts group counter at 1", () => {
            expect(createId("group")).toBe(1);
        });

        test("starts expense counter at 1", () => {
            expect(createId("expense")).toBe(1);
        });

        test("starts settlement counter at 1", () => {
            expect(createId("settlement")).toBe(1);
        });

        test("starts member counter at 1", () => {
            expect(createId("member")).toBe(1);
        });

        test("increments independently per type", () => {
            expect(createId("user")).toBe(1);
            expect(createId("user")).toBe(2);
            expect(createId("group")).toBe(1);
            expect(createId("group")).toBe(2);
            expect(createId("expense")).toBe(1);
            expect(createId("expense")).toBe(2);
            expect(createId("settlement")).toBe(1);
            expect(createId("settlement")).toBe(2);
            expect(createId("member")).toBe(1);
            expect(createId("member")).toBe(2);
        });
    });

    describe("hydrated state", () => {
        test("continues user counter after max existing id", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                users: [
                    { id: 3, name: "Alice", createdAt: 1000000 },
                    { id: 7, name: "Bob", createdAt: 1000000 },
                ],
            });

            expect(createId("user")).toBe(8);
        });

        test("continues group counter after max existing id", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 5,
                        name: "Trip",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });

            expect(createId("group")).toBe(6);
        });

        test("continues expense counter after max existing id across all groups", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [{ id: 4 } as unknown as Expense],
                        settlements: [],
                    },
                    {
                        id: 2,
                        name: "Group B",
                        createdAt: 1000000,
                        members: [],
                        expenses: [{ id: 9 } as unknown as Expense],
                        settlements: [],
                    },
                ],
            });

            expect(createId("expense")).toBe(10);
        });

        test("continues settlement counter after max existing id across all groups", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [{ id: 6 } as unknown as Settlement],
                    },
                ],
            });

            expect(createId("settlement")).toBe(7);
        });

        test("continues member counter after max existing id across all groups", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [{ id: 4, name: "Alice", createdAt: 1000000 }],
                        expenses: [],
                        settlements: [],
                    },
                    {
                        id: 2,
                        name: "Group B",
                        createdAt: 1000000,
                        members: [{ id: 9, name: "Bob", createdAt: 1000000 }],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });

            expect(createId("member")).toBe(10);
        });

        test("starts member counter at 1 when no group has members", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });

            expect(createId("member")).toBe(1);
        });

        test("uses the highest member id when unsorted across groups", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [
                            { id: 9, name: "Alice", createdAt: 1000000 },
                            { id: 3, name: "Bob", createdAt: 1000000 },
                        ],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });

            expect(createId("member")).toBe(10);
        });

        test("each type counter is independent from others", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                users: [{ id: 10, name: "Alice", createdAt: 1000000 }],
                groups: [
                    {
                        id: 3,
                        name: "Trip",
                        createdAt: 1000000,
                        members: [{ id: 5, name: "Alice", createdAt: 1000000 }],
                        expenses: [{ id: 7 } as unknown as Expense],
                        settlements: [{ id: 2 } as unknown as Settlement],
                    },
                ],
            });

            expect(createId("user")).toBe(11);
            expect(createId("group")).toBe(4);
            expect(createId("expense")).toBe(8);
            expect(createId("settlement")).toBe(3);
            expect(createId("member")).toBe(6);
        });

        test("uses the highest user id when unsorted", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                users: [
                    { id: 7, name: "Alice", createdAt: 1000000 },
                    { id: 3, name: "Bob", createdAt: 1000000 },
                ],
            });

            expect(createId("user")).toBe(8);
        });

        test("uses the highest expense id when unsorted across groups", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [
                            { id: 9 } as unknown as Expense,
                            { id: 3 } as unknown as Expense,
                        ],
                        settlements: [],
                    },
                ],
            });

            expect(createId("expense")).toBe(10);
        });

        test("uses the highest settlement id when unsorted", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 1,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [
                            { id: 6 } as unknown as Settlement,
                            { id: 2 } as unknown as Settlement,
                        ],
                    },
                ],
            });

            expect(createId("settlement")).toBe(7);
        });

        test("uses the highest group id when unsorted", () => {
            const createId = createIdGenerator({
                ...emptyGlobal,
                groups: [
                    {
                        id: 5,
                        name: "Group A",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [],
                    },
                    {
                        id: 2,
                        name: "Group B",
                        createdAt: 1000000,
                        members: [],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });

            expect(createId("group")).toBe(6);
        });
    });

    describe("multiple generators are independent", () => {
        test("two generators from same state do not share counters", () => {
            const createIdA = createIdGenerator(emptyGlobal);
            const createIdB = createIdGenerator(emptyGlobal);

            expect(createIdA("user")).toBe(1);
            expect(createIdA("user")).toBe(2);
            expect(createIdB("user")).toBe(1);
            expect(createIdA("member")).toBe(1);
            expect(createIdA("member")).toBe(2);
            expect(createIdB("member")).toBe(1);
        });
    });
});
