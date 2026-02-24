import type { EntityId } from "@domain/common";
import { createIdGenerator } from "@domain/common/create-id";
import type { Expense } from "@domain/expense";
import { type Global, GlobalSchema } from "@domain/global";
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

export const useAppStore = create<AppStore>()((set, _get) => ({
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
    initEmpty: () => {},
    syncToUrl: () => {},
    addUser: () => {},
    addGroup: () => {},
    addExpense: () => {},
    addSettlement: () => {},
}));
