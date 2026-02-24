import type { EntityId } from "@domain/common";
import { createIdGenerator } from "@domain/common/create-id";
import type { Expense } from "@domain/expense";
import type { Global } from "@domain/global";
import type { Settlement } from "@domain/settlement";
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

export const useAppStore = create<AppStore>()((_set, _get) => ({
    status: "empty",
    global: emptyGlobal,
    createId: createIdGenerator(emptyGlobal),
    hydrateFromUrl: () => {},
    initEmpty: () => {},
    syncToUrl: () => {},
    addUser: () => {},
    addGroup: () => {},
    addExpense: () => {},
    addSettlement: () => {},
}));
