import type { EqualExpense } from "@domain/expense";
import type { Global } from "@domain/global";
import type { Group } from "@domain/group";
import { useAppStore } from "@store";
import { beforeEach, describe, expect, test, vi } from "vitest";

const validGlobal: Global = {
    version: 1,
    users: [{ id: 1, name: "Alice" }],
    groups: [],
};

const validGlobalEncoded = encodeURIComponent(JSON.stringify(validGlobal));

beforeEach(() => {
    useAppStore.getState().initEmpty();
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
        value: { search: "", href: "http://localhost/" },
        writable: true,
    });
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});

function setupGroupWithTwoMembers(): Group {
    useAppStore.getState().addUser("Alice");
    useAppStore.getState().addUser("Bob");
    useAppStore.getState().addGroup("Trip", [1, 2]);
    return useAppStore.getState().global.groups[0];
}

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

        const expense: Omit<EqualExpense, "id"> = {
            title: "Hotel",
            total: 10000,
            payerId: 1,
            splitMode: "equal",
            memberIds: [1, 2],
        };

        useAppStore.getState().addExpense(group.id, expense);

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

        const expense: Omit<EqualExpense, "id"> = {
            title: "Hotel",
            total: 10000,
            payerId: 1,
            splitMode: "equal",
            memberIds: [1, 2],
        };

        useAppStore.getState().addExpense(group.id, expense);

        const updated = useAppStore
            .getState()
            .global.groups.find((g) => g.id === dinnerGroup.id);

        expect(updated?.expenses).toHaveLength(0);
    });

    test("assigns sequential IDs", () => {
        const group = setupGroupWithTwoMembers();

        const expense1: Omit<EqualExpense, "id"> = {
            title: "Hotel",
            total: 10000,
            payerId: 1,
            splitMode: "equal",
            memberIds: [1, 2],
        };

        const expense2: Omit<EqualExpense, "id"> = {
            title: "Food",
            total: 5000,
            payerId: 2,
            splitMode: "equal",
            memberIds: [1, 2],
        };

        useAppStore.getState().addExpense(group.id, expense1);

        useAppStore.getState().addExpense(group.id, expense2);

        const updated = useAppStore
            .getState()
            .global.groups.find((g) => g.id === group.id);

        expect(updated?.expenses[0].id).toBe(1);
        expect(updated?.expenses[1].id).toBe(2);
    });
});

describe("addSettlement", () => {
    test("adds settlement to correct group", () => {
        useAppStore.getState().addGroup("Dinner", [1, 2]);

        const group = setupGroupWithTwoMembers();

        useAppStore.getState().addSettlement(group.id, {
            fromMemberId: 1,
            toMemberId: 2,
            amount: 5000,
        });

        const updated = useAppStore
            .getState()
            .global.groups.find((g) => g.id === group.id);

        expect(updated?.settlements).toHaveLength(1);
        expect(updated?.settlements[0].fromMemberId).toBe(1);
        expect(updated?.settlements[0].toMemberId).toBe(2);
    });

    test("does not affect other groups", () => {
        const group = setupGroupWithTwoMembers();

        useAppStore.getState().addGroup("Dinner", [1, 2]);

        const dinnerGroup = useAppStore.getState().global.groups[1];

        useAppStore.getState().addSettlement(group.id, {
            fromMemberId: 1,
            toMemberId: 2,
            amount: 5000,
        });

        const updated = useAppStore
            .getState()
            .global.groups.find((g) => g.id === dinnerGroup.id);

        expect(updated?.settlements).toHaveLength(0);
    });

    test("assigns sequential IDs", () => {
        const group = setupGroupWithTwoMembers();

        useAppStore.getState().addSettlement(group.id, {
            fromMemberId: 1,
            toMemberId: 2,
            amount: 5000,
        });

        useAppStore.getState().addSettlement(group.id, {
            fromMemberId: 2,
            toMemberId: 1,
            amount: 3000,
        });

        const updated = useAppStore
            .getState()
            .global.groups.find((g) => g.id === group.id);

        expect(updated?.settlements[0].id).toBe(1);
        expect(updated?.settlements[1].id).toBe(2);
    });
});
