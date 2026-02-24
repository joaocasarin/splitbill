import type { EntityId } from "@domain/common";
import { createIdGenerator } from "@domain/common/create-id";
import type { Expense } from "@domain/expense";
import { type Global, GlobalSchema } from "@domain/global";
import type { Group } from "@domain/group";
import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { create } from "zustand";

type AppStatus = "empty" | "loaded" | "error";

type AppState = {
    status: AppStatus;
    global: Global;
    createId: ReturnType<typeof createIdGenerator>;
};

type AppActions = {
    hydrateFromUrl: () => void;
    initEmpty: () => void;
    syncToUrl: () => void;
    addUser: (name: string) => void;
    addGroup: (name: string, memberIds: EntityId[]) => void;
    addExpense: (groupId: EntityId, expense: Omit<Expense, "id">) => void;
    addSettlement: (
        groupId: EntityId,
        settlement: Omit<Settlement, "id">,
    ) => void;
};

export type AppStore = AppState & AppActions;

const emptyGlobal: Global = {
    version: 1,
    users: [],
    groups: [],
};

export const useAppStore = create<AppStore>()((set, get) => ({
    status: "empty",
    global: emptyGlobal,
    createId: createIdGenerator(emptyGlobal),
    hydrateFromUrl: () => {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("state");

        if (!raw) {
            set({ status: "empty" });
            return;
        }

        try {
            const parsed = JSON.parse(decodeURIComponent(raw));
            const result = GlobalSchema.parse(parsed);
            set({
                status: "loaded",
                global: result,
                createId: createIdGenerator(result),
            });
        } catch {
            set({ status: "error" });
        }
    },
    initEmpty: () => {
        set({
            status: "empty",
            global: emptyGlobal,
            createId: createIdGenerator(emptyGlobal),
        });
    },
    syncToUrl: () => {
        const { global } = get();
        const encoded = encodeURIComponent(JSON.stringify(global));
        const url = new URL(window.location.href);
        url.searchParams.set("state", encoded);
        window.history.replaceState(null, "", url.toString());
    },
    addUser: (name: string) => {
        const { global, createId, syncToUrl } = get();
        const newUser: User = {
            id: createId("user"),
            name,
        };
        set({
            status: "loaded",
            global: {
                ...global,
                users: [...global.users, newUser],
            },
        });
        syncToUrl();
    },
    addGroup: (name: string, memberIds: EntityId[]) => {
        const { global, createId, syncToUrl } = get();
        const newGroup: Group = {
            id: createId("group"),
            name,
            memberIds,
            expenses: [],
            settlements: [],
        };
        set({
            status: "loaded",
            global: { ...global, groups: [...global.groups, newGroup] },
        });
        syncToUrl();
    },
    addExpense: (groupId: EntityId, expense: Omit<Expense, "id">) => {
        const { global, createId, syncToUrl } = get();
        const newExpense = {
            ...expense,
            id: createId("expense"),
        } as Expense;
        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              expenses: [...group.expenses, newExpense],
                          }
                        : group,
                ),
            },
        });
        syncToUrl();
    },
    addSettlement: () => {},
}));
