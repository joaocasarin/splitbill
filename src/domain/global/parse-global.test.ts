import { SCHEMA_VERSION } from "@domain/common";
import { baseGroup, emptyGlobal } from "@tests/mocks";
import { describe, expect, test } from "vitest";
import { parseGlobal } from "./parse-global";

describe("parseGlobal", () => {
    describe("valid input", () => {
        test("returns success with data for a valid Global object", () => {
            const result = parseGlobal(emptyGlobal);
            expect(result).toEqual({ success: true, data: emptyGlobal });
        });

        test("returns success with data for a Global with groups", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [baseGroup],
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.groups).toHaveLength(1);
            }
        });
    });

    describe("invalid schema", () => {
        test("returns failure when version field is missing", () => {
            const result = parseGlobal({ groups: [] });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "version: Invalid input: expected number, received undefined",
                );
            }
        });

        test("returns failure when groups field is missing", () => {
            const result = parseGlobal({ version: SCHEMA_VERSION });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "groups: Invalid input: expected array, received undefined",
                );
            }
        });

        test("returns failure when groups contains invalid members", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [{ id: 1, name: "Trip" }],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip' (createdAt): Invalid input: expected number, received undefined",
                );
                expect(result.error).toContain(
                    "Group 'Trip' (members): Invalid input: expected array, received undefined",
                );
            }
        });

        test("returns failure when groups contains unnamed group — uses index fallback", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Group 1 (name): Invalid input: expected string, received undefined",
                );
            }
        });

        test("returns failure when groups item is not an object — no field path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: ["not an object"],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Group 1: Invalid input: expected object, received string",
                );
            }
        });

        test("resolves member name in error path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "braddock",
                        createdAt: "asdasd",
                        members: [
                            { id: 1, name: "joao", createdAt: "adwdd" },
                            { id: 2, name: "tati", createdAt: "sd44" },
                        ],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'braddock' (createdAt): Invalid input: expected number, received string",
                );
                expect(result.error).toContain(
                    "Group 'braddock', Member 'joao' (createdAt): Invalid input: expected number, received string",
                );
                expect(result.error).toContain(
                    "Group 'braddock', Member 'tati' (createdAt): Invalid input: expected number, received string",
                );
            }
        });

        test("uses index fallback when member has no name", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Member 1 (name): Invalid input: expected string, received undefined",
                );
            }
        });

        test("uses index fallback when member item is not an object — no field path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            "not an object",
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Member 1: Invalid input: expected object, received string",
                );
            }
        });

        test("resolves expense index when expense item is not an object", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "braddock",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: ["not an object"],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'braddock', Expense 1: Invalid input: expected object, received string",
                );
            }
        });

        test("resolves expense name in error path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [
                            {
                                id: 1,
                                title: "Dinner",
                                total: -1,
                                payerId: 1,
                                createdAt: 1000,
                                splitMode: "equal",
                                memberIds: [1, 2],
                            },
                        ],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Expense 'Dinner' (total): Expense total must be greater than zero",
                );
            }
        });

        test("uses expense index fallback when expense has no title", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [
                            {
                                id: 1,
                                total: 1000,
                                payerId: 1,
                                createdAt: 1000,
                                splitMode: "equal",
                                memberIds: [1, 2],
                            },
                        ],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Expense 1 (title): Invalid input: expected string, received undefined",
                );
            }
        });

        test("uses key-without-index path for duplicate expense IDs", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [
                            {
                                id: 1,
                                title: "Dinner",
                                total: 1000,
                                payerId: 1,
                                createdAt: 1000,
                                splitMode: "equal",
                                memberIds: [1, 2],
                            },
                            {
                                id: 1,
                                title: "Lunch",
                                total: 500,
                                payerId: 2,
                                createdAt: 1001,
                                splitMode: "equal",
                                memberIds: [1, 2],
                            },
                        ],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip' (expenses): Duplicate expense IDs in group",
                );
            }
        });

        test("resolves settlement index in error path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [],
                        settlements: [
                            {
                                id: 1,
                                fromMemberId: 99,
                                toMemberId: 2,
                                amount: 100,
                                createdAt: 1000,
                            },
                        ],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Settlement 1 (fromMemberId): Settlement[0]: fromMemberId 99 is not a member of the group",
                );
            }
        });

        test("uses key-without-index path for duplicate settlement IDs", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [],
                        settlements: [
                            {
                                id: 1,
                                fromMemberId: 1,
                                toMemberId: 2,
                                amount: 100,
                                createdAt: 1000,
                            },
                            {
                                id: 1,
                                fromMemberId: 2,
                                toMemberId: 1,
                                amount: 50,
                                createdAt: 1001,
                            },
                        ],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip' (settlements): Duplicate settlement IDs in group",
                );
            }
        });

        test("resolves share index in error path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [
                            {
                                id: 1,
                                title: "Dinner",
                                total: 1000,
                                payerId: 1,
                                createdAt: 1000,
                                splitMode: "fixed",
                                shares: [
                                    { memberId: 1, value: 600 },
                                    { memberId: 99, value: 400 },
                                ],
                            },
                        ],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Expense 'Dinner', Share 2 (memberId): Expense[0]: shares[1].memberId 99 is not a member of the group",
                );
            }
        });

        test("resolves memberIds index in error path", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [
                    {
                        id: 1,
                        name: "Trip",
                        createdAt: 1000,
                        members: [
                            { id: 1, name: "Alice", createdAt: 1000 },
                            { id: 2, name: "Bob", createdAt: 1000 },
                        ],
                        expenses: [
                            {
                                id: 1,
                                title: "Dinner",
                                total: 1000,
                                payerId: 1,
                                createdAt: 1000,
                                splitMode: "equal",
                                memberIds: [1, 99],
                            },
                        ],
                        settlements: [],
                    },
                ],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain(
                    "Group 'Trip', Expense 'Dinner', MemberId 2: Expense[0]: memberIds[1] 99 is not a member of the group",
                );
            }
        });

        test("returns failure when groups has duplicate IDs", () => {
            const result = parseGlobal({
                version: SCHEMA_VERSION,
                groups: [baseGroup, baseGroup],
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "groups: Duplicate group IDs in global state",
                );
            }
        });
    });

    describe("non-object input", () => {
        test("returns failure for null", () => {
            const result = parseGlobal(null);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Invalid input: expected object, received null",
                );
            }
        });

        test("returns failure for a string", () => {
            const result = parseGlobal("not an object");
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Invalid input: expected object, received string",
                );
            }
        });

        test("returns failure for an array", () => {
            const result = parseGlobal([]);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Invalid input: expected object, received array",
                );
            }
        });

        test("returns failure for a number", () => {
            const result = parseGlobal(42);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Invalid input: expected object, received number",
                );
            }
        });

        test("returns failure for undefined", () => {
            const result = parseGlobal(undefined);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    "Invalid input: expected object, received undefined",
                );
            }
        });
    });
});
