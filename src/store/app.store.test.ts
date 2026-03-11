import { computeBalances } from "@domain/balance";
import type { EqualExpense } from "@domain/expense";
import { useAppStore } from "@store";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { defaultEqualExpense, validGlobalEncoded } from "@tests/mocks";
import { setupStoreAndWindow } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@domain/balance", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@domain/balance")>();
    return {
        ...actual,
        computeBalances: vi.fn(actual.computeBalances),
    };
});

beforeEach(() => {
    setupStoreAndWindow({ restoreMocks: true });
});

describe("AppStore", () => {
    describe("syncToUrl", () => {
        test("sets state param in URL passed to history.replaceState", () => {
            useAppStore.getState().addUser("Alice");

            const lastCall = vi
                .mocked(window.history.replaceState)
                .mock.calls.at(-1);

            expect(lastCall?.[2]).toContain("state=");
        });
    });

    describe("hydrateFromUrl", () => {
        test("sets status to empty when no ?state= param", () => {
            Object.defineProperty(window, "location", {
                value: { search: "" },
                writable: true,
            });

            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().status).toBe("empty");
        });
        test("sets status to loaded with parsed global when valid state", () => {
            Object.defineProperty(window, "location", {
                value: { search: `?state=${validGlobalEncoded}` },
                writable: true,
            });

            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().status).toBe("loaded");
        });
        test("sets status to error when state is invalid JSON", () => {
            Object.defineProperty(window, "location", {
                value: { search: "?state=invalid" },
                writable: true,
            });

            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().status).toBe("error");
        });
        test("sets status to error when state fails schema validation", () => {
            const invalidGlobal = encodeURIComponent(
                JSON.stringify({ version: -1 }),
            );
            Object.defineProperty(window, "location", {
                value: { search: `?state=${invalidGlobal}` },
                writable: true,
            });

            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().status).toBe("error");
        });
        test("initializes createId counters from loaded state", () => {
            Object.defineProperty(window, "location", {
                value: { search: `?state=${validGlobalEncoded}` },
                writable: true,
            });
            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().createId("user")).toBe(2);
        });
    });

    describe("initEmpty", () => {
        test("resets status to empty", () => {
            Object.defineProperty(window, "location", {
                value: { search: `?state=${validGlobalEncoded}` },
                writable: true,
            });

            useAppStore.getState().hydrateFromUrl();
            expect(useAppStore.getState().status).toBe("loaded");

            useAppStore.getState().initEmpty();
            expect(useAppStore.getState().status).toBe("empty");
        });
        test("resets global to empty state", () => {
            Object.defineProperty(window, "location", {
                value: { search: `?state=${validGlobalEncoded}` },
                writable: true,
            });
            useAppStore.getState().hydrateFromUrl();

            useAppStore.getState().initEmpty();
            expect(useAppStore.getState().global).toEqual({
                version: 1,
                users: [],
                groups: [],
            });
        });
    });

    describe("addUser", () => {
        test("adds user to global.users", () => {
            useAppStore.getState().addUser("Alice");
            expect(useAppStore.getState().global.users).toHaveLength(1);
            expect(useAppStore.getState().global.users[0].name).toBe("Alice");
        });
        test("assigns sequential IDs", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            expect(useAppStore.getState().global.users[0].id).toBe(1);
            expect(useAppStore.getState().global.users[1].id).toBe(2);
        });
        test("sets status to loaded", () => {
            useAppStore.getState().addUser("Alice");
            expect(useAppStore.getState().status).toBe("loaded");
        });
    });

    describe("addGroup", () => {
        test("adds group to global.groups", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);

            expect(useAppStore.getState().global.groups).toHaveLength(1);
            expect(useAppStore.getState().global.groups[0].name).toBe("Trip");
        });
        test("assigns sequential IDs", () => {
            useAppStore.getState().addGroup("Trip", []);
            useAppStore.getState().addGroup("Dinner", []);
            expect(useAppStore.getState().global.groups[0].id).toBe(1);
            expect(useAppStore.getState().global.groups[1].id).toBe(2);
        });
        test("preserves memberIds order", () => {
            useAppStore.getState().addGroup("Trip", [3, 1, 2]);
            expect(useAppStore.getState().global.groups[0].memberIds).toEqual([
                3, 1, 2,
            ]);
        });
    });

    describe("addExpense", () => {
        test("adds expense to correct group", () => {
            useAppStore.getState().addGroup("Dinner", [1, 2]);

            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(updated?.expenses).toHaveLength(1);
            expect(updated?.expenses[0].title).toBe("Hotel");
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addGroup("Dinner", [1, 2]);

            const dinnerGroup = useAppStore.getState().global.groups[1];

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(updated?.expenses).toHaveLength(0);
        });

        test("assigns sequential IDs", () => {
            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            useAppStore.getState().addExpense(group.id, {
                ...defaultEqualExpense,
                title: "Food",
                total: 5000,
                payerId: 2,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(updated?.expenses[0].id).toBe(1);
            expect(updated?.expenses[1].id).toBe(2);
        });
    });

    describe("deleteExpense", () => {
        test("removes expense from correct group", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const expenseId =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses[0]
                    .id ?? -1;

            const result = useAppStore
                .getState()
                .deleteExpense(group.id, expenseId);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.expenses).toHaveLength(0);
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            useAppStore.getState().addGroup("Dinner", [1, 2]);
            const dinnerGroup = useAppStore.getState().global.groups[1];
            useAppStore.getState().addExpense(dinnerGroup.id, {
                ...defaultEqualExpense,
                title: "Food",
            });

            const expenseId =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses[0]
                    .id ?? -1;

            useAppStore.getState().deleteExpense(group.id, expenseId);

            const updatedDinner = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(updatedDinner?.expenses).toHaveLength(1);
        });

        test("does nothing when expense ID does not exist", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const result = useAppStore.getState().deleteExpense(group.id, 999);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.expenses).toHaveLength(1);
        });

        test("returns invalid when group not found", () => {
            const result = useAppStore.getState().deleteExpense(999, 1);

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("group not found");
            }
        });
    });

    describe("updateExpense", () => {
        test("replaces expense in correct group", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const expenses =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses ??
                [];

            const result = useAppStore.getState().updateExpense(group.id, {
                ...expenses[0],
                title: "Updated Hotel",
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.expenses).toHaveLength(1);
            expect(updated?.expenses[0].title).toBe("Updated Hotel");
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            useAppStore.getState().addGroup("Dinner", [1, 2]);
            const dinnerGroup = useAppStore.getState().global.groups[1];
            useAppStore.getState().addExpense(dinnerGroup.id, {
                ...defaultEqualExpense,
                title: "Food",
            });

            const expenses =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)?.expenses ??
                [];

            useAppStore.getState().updateExpense(group.id, {
                ...expenses[0],
                title: "Updated Hotel",
            });

            const updatedDinner = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(updatedDinner?.expenses[0].title).toBe("Food");
        });

        test("does nothing when expense ID does not exist in group", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const result = useAppStore.getState().updateExpense(group.id, {
                id: 999,
                title: "Ghost",
                total: 1000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as EqualExpense);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.expenses).toHaveLength(1);
            expect(updated?.expenses[0].title).toBe("Hotel");
        });

        test("returns invalid when group not found", () => {
            const result = useAppStore.getState().updateExpense(999, {
                id: 1,
                title: "Ghost",
                total: 1000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2],
            } as EqualExpense);

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("group not found");
            }
        });
    });

    describe("addSettlement", () => {
        test("adds settlement to correct group", () => {
            useAppStore.getState().addGroup("Dinner", [1, 2]);

            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const result = useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements).toHaveLength(1);
            expect(updated?.settlements[0].fromMemberId).toBe(2);
            expect(updated?.settlements[0].toMemberId).toBe(1);
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addGroup("Dinner", [1, 2]);

            const dinnerGroup = useAppStore.getState().global.groups[1];

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const result = useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements).toHaveLength(0);
        });

        test("assigns sequential IDs", () => {
            const group = setupGroupWithTwoMembers();

            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            const result = useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 2000,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements[0].id).toBe(1);
            expect(updated?.settlements[1].id).toBe(2);
        });

        test("returns invalid when group not found", () => {
            useAppStore.getState().addGroup("Dinner", [1, 2]);

            const result = useAppStore.getState().addSettlement(2, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("group not found");
            }
        });

        test("returns invalid when there is no direct debt between members", () => {
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Dinner", [1, 2, 3]);

            useAppStore.getState().addExpense(1, defaultEqualExpense);

            const result = useAppStore.getState().addSettlement(1, {
                fromMemberId: 2,
                toMemberId: 3,
                amount: 5000,
            });

            expect(result.valid).toBe(false);

            if (!result.valid) {
                expect(result.reason).toBe(
                    "no direct debt from fromMember to toMember",
                );
            }
        });
    });

    describe("updateSettlement", () => {
        test("replaces settlement in correct group", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            const settlements =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements ?? [];

            const result = useAppStore.getState().updateSettlement(group.id, {
                ...settlements[0],
                amount: 4000,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements).toHaveLength(1);
            expect(updated?.settlements[0].amount).toBe(4000);
        });

        test("only replaces the matching settlement", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 1000,
            });
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 1000,
            });

            const settlements =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements ?? [];

            useAppStore.getState().updateSettlement(group.id, {
                ...settlements[0],
                amount: 2000,
            });

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(updated?.settlements).toHaveLength(2);
            expect(updated?.settlements[0].amount).toBe(2000);
            expect(updated?.settlements[1].amount).toBe(1000);
        });

        test("allows updating to the full original debt amount", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            // defaultEqualExpense: Hotel R$100, paid by user 1, split [1,2]
            // Bob (2) owes Alice (1) R$50

            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            const settlements =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements ?? [];

            // Edit from 3000 to 5000 — should succeed because debt without
            // this settlement is 5000
            const result = useAppStore.getState().updateSettlement(group.id, {
                ...settlements[0],
                amount: 5000,
            });

            expect(result.valid).toBe(true);
            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);
            expect(updated?.settlements[0].amount).toBe(5000);
        });

        test("returns invalid when amount exceeds original debt", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);

            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            const settlements =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements ?? [];

            // Debt is 5000, trying to set to 6000
            const result = useAppStore.getState().updateSettlement(group.id, {
                ...settlements[0],
                amount: 6000,
            });

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("amount exceeds outstanding debt");
            }
        });

        test("returns invalid when group not found", () => {
            const result = useAppStore.getState().updateSettlement(999, {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 1000,
            });

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("group not found");
            }
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            useAppStore.getState().addGroup("Dinner", [1, 2]);
            const dinnerGroup = useAppStore.getState().global.groups[1];
            useAppStore
                .getState()
                .addExpense(dinnerGroup.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(dinnerGroup.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 2000,
            });

            const settlements =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements ?? [];

            useAppStore.getState().updateSettlement(group.id, {
                ...settlements[0],
                amount: 4000,
            });

            const updatedDinner = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(updatedDinner?.settlements[0].amount).toBe(2000);
        });
    });

    describe("deleteSettlement", () => {
        test("removes settlement from correct group", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });

            const settlementId =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements[0].id ?? -1;

            const result = useAppStore
                .getState()
                .deleteSettlement(group.id, settlementId);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements).toHaveLength(0);
        });

        test("does not affect other groups", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 3000,
            });

            useAppStore.getState().addGroup("Dinner", [1, 2]);
            const dinnerGroup = useAppStore.getState().global.groups[1];
            useAppStore
                .getState()
                .addExpense(dinnerGroup.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(dinnerGroup.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 2000,
            });

            const settlementId =
                useAppStore
                    .getState()
                    .global.groups.find((g) => g.id === group.id)
                    ?.settlements[0].id ?? -1;

            useAppStore.getState().deleteSettlement(group.id, settlementId);

            const updatedDinner = useAppStore
                .getState()
                .global.groups.find((g) => g.id === dinnerGroup.id);

            expect(updatedDinner?.settlements).toHaveLength(1);
        });

        test("does nothing when settlement ID does not exist", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, defaultEqualExpense);
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });

            const result = useAppStore
                .getState()
                .deleteSettlement(group.id, 999);

            const updated = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id);

            expect(result.valid).toBe(true);
            expect(updated?.settlements).toHaveLength(1);
        });

        test("returns invalid when group not found", () => {
            const result = useAppStore.getState().deleteSettlement(999, 1);

            expect(result.valid).toBe(false);
            if (!result.valid) {
                expect(result.reason).toBe("group not found");
            }
        });
    });

    describe("addMemberToGroup", () => {
        test("adds user to group memberIds", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);

            useAppStore.getState().addMemberToGroup(1, 3);

            const group = useAppStore.getState().global.groups[0];
            expect(group.memberIds).toContain(3);
        });

        test("does not add duplicate member", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);

            useAppStore.getState().addMemberToGroup(1, 1);

            const group = useAppStore.getState().global.groups[0];
            expect(group.memberIds.filter((id) => id === 1)).toHaveLength(1);
        });
    });

    describe("removeMemberFromGroup", () => {
        test("removes member with zero balance from group with 3+ members", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);

            const result = useAppStore.getState().removeMemberFromGroup(1, 3);

            expect(result.valid).toBe(true);
            const group = useAppStore.getState().global.groups[0];
            expect(group.memberIds).not.toContain(3);
        });

        test("returns invalid when group not found", () => {
            const result = useAppStore.getState().removeMemberFromGroup(99, 1);
            expect(result.valid).toBe(false);
            if (!result.valid) expect(result.reason).toBe("group not found");
        });

        test("returns invalid when member not in group", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);

            const result = useAppStore.getState().removeMemberFromGroup(1, 3);
            expect(result.valid).toBe(false);
            if (!result.valid)
                expect(result.reason).toBe("member not found in group");
        });

        test("returns invalid when group would drop below 2 members", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);

            const result = useAppStore.getState().removeMemberFromGroup(1, 1);
            expect(result.valid).toBe(false);
            if (!result.valid)
                expect(result.reason).toBe(
                    "group must have at least 2 members",
                );
        });

        test("returns invalid when member has non-zero balance", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);

            useAppStore.getState().addExpense(1, {
                title: "Dinner",
                total: 30000,
                payerId: 1,
                splitMode: "equal",
                memberIds: [1, 2, 3],
            } as unknown as Omit<EqualExpense, "id">);

            const result = useAppStore.getState().removeMemberFromGroup(1, 1);
            expect(result.valid).toBe(false);
            if (!result.valid)
                expect(result.reason).toBe("member has non-zero balance");
        });

        test("does not affect other groups when removing a member", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);
            useAppStore.getState().addGroup("Dinn", [1, 2, 3]);

            useAppStore.getState().removeMemberFromGroup(1, 3);

            const dinner = useAppStore.getState().global.groups[1];
            expect(dinner.memberIds).toContain(3);
        });

        describe("defensive guards (unreachable in valid usage)", () => {
            test("removes member when balance entry is absent for that member", () => {
                vi.mocked(computeBalances).mockReturnValueOnce([]);

                useAppStore.getState().addUser("Alice");
                useAppStore.getState().addUser("Bob");
                useAppStore.getState().addUser("Carol");
                useAppStore.getState().addGroup("Trip", [1, 2, 3]);

                const result = useAppStore
                    .getState()
                    .removeMemberFromGroup(1, 3);
                expect(result.valid).toBe(true);
                const group = useAppStore.getState().global.groups[0];
                expect(group.memberIds).not.toContain(3);
            });
        });
    });
});
