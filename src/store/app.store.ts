import { computeBalances } from "@domain/balance";
import {
    createIdGenerator,
    type EntityId,
    SCHEMA_VERSION,
} from "@domain/common";
import type { CreateExpense, Expense } from "@domain/expense";
import { type Global, GlobalSchema } from "@domain/global";
import type { Group } from "@domain/group";
import { type Member, validateMemberDeletion } from "@domain/member";
import {
    type CreateSettlement,
    type Settlement,
    type ValidationResult,
} from "@domain/settlement";
import lzstring from "lz-string";
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
    addGroupWithMembers: (name: string, memberNames: string[]) => void;
    addMemberByName: (groupId: EntityId, name: string) => void;
    removeMemberFromGroup: (
        groupId: EntityId,
        userId: EntityId,
    ) => ValidationResult;
    addExpense: (groupId: EntityId, expense: CreateExpense) => void;
    updateExpense: (groupId: EntityId, expense: Expense) => void;
    deleteExpense: (groupId: EntityId, expenseId: EntityId) => void;
    addSettlement: (groupId: EntityId, settlement: CreateSettlement) => void;
    updateSettlement: (groupId: EntityId, settlement: Settlement) => void;
    deleteSettlement: (groupId: EntityId, settlementId: EntityId) => void;
};

export type AppStore = AppState & AppActions;

const emptyGlobal: Global = {
    version: SCHEMA_VERSION,
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
            const decompressedState =
                lzstring.decompressFromEncodedURIComponent(raw);

            if (!decompressedState) {
                throw new Error("decompression failed");
            }

            const parsed = JSON.parse(decompressedState);
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
        const compressedState = lzstring.compressToEncodedURIComponent(
            JSON.stringify(global),
        );
        const url = new URL(window.location.href);
        url.searchParams.set("state", compressedState);
        window.history.replaceState(null, "", url.toString());
    },
    addGroupWithMembers: (name: string, memberNames: string[]) => {
        const { global, createId, syncToUrl } = get();
        const members: Member[] = memberNames.map((memberName) => ({
            id: createId("member"),
            name: memberName,
            createdAt: Date.now(),
        }));
        const newGroup: Group = {
            id: createId("group"),
            name,
            createdAt: Date.now(),
            members,
            expenses: [],
            settlements: [],
        };
        set({
            status: "loaded",
            global: { ...global, groups: [...global.groups, newGroup] },
        });
        syncToUrl();
    },
    addMemberByName: (groupId: EntityId, name: string) => {
        const { global, createId, syncToUrl } = get();
        const memberId = createId("member");
        const newMember: Member = {
            id: memberId,
            name,
            createdAt: Date.now(),
        };
        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              members: [...g.members, newMember],
                          }
                        : g,
                ),
            },
        });
        syncToUrl();
    },
    removeMemberFromGroup: (
        groupId: EntityId,
        userId: EntityId,
    ): ValidationResult => {
        const { global, syncToUrl } = get();
        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

        const isActiveMember = group.members.some(
            (m) => m.id === userId && !m.deletedAt,
        );
        if (!isActiveMember) {
            return { valid: false, reason: "member not found in group" };
        }

        const activeCount = group.members.filter((m) => !m.deletedAt).length;
        const balances = computeBalances(group);
        const validation = validateMemberDeletion(
            userId,
            balances,
            activeCount,
        );

        if (!validation.valid) return validation;

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              members: g.members.map((m) =>
                                  m.id === userId
                                      ? { ...m, deletedAt: Date.now() }
                                      : m,
                              ),
                          }
                        : g,
                ),
            },
        });
        syncToUrl();
        return { valid: true };
    },
    addExpense: (groupId: EntityId, expense: CreateExpense) => {
        const { global, createId, syncToUrl } = get();
        const newExpense = {
            ...expense,
            id: createId("expense"),
            createdAt: Date.now(),
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
    deleteExpense: (groupId: EntityId, expenseId: EntityId) => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) return;

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              expenses: g.expenses.filter(
                                  (e) => e.id !== expenseId,
                              ),
                          }
                        : g,
                ),
            },
        });
        syncToUrl();
    },
    updateExpense: (groupId: EntityId, expense: Expense) => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) return;

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              expenses: g.expenses.map((e) =>
                                  e.id === expense.id
                                      ? { ...expense, updatedAt: Date.now() }
                                      : e,
                              ),
                          }
                        : g,
                ),
            },
        });
        syncToUrl();
    },
    addSettlement: (groupId: EntityId, settlement: CreateSettlement) => {
        const { global, createId, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) return;

        const newSettlement: Settlement = {
            ...settlement,
            id: createId("settlement"),
            createdAt: Date.now(),
        };

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              settlements: [...g.settlements, newSettlement],
                          }
                        : g,
                ),
            },
        });

        syncToUrl();
    },
    updateSettlement: (groupId: EntityId, settlement: Settlement) => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) return;

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              settlements: g.settlements.map((s) =>
                                  s.id === settlement.id
                                      ? {
                                            ...settlement,
                                            updatedAt: Date.now(),
                                        }
                                      : s,
                              ),
                          }
                        : g,
                ),
            },
        });

        syncToUrl();
    },
    deleteSettlement: (groupId: EntityId, settlementId: EntityId) => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) return;

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              settlements: g.settlements.filter(
                                  (s) => s.id !== settlementId,
                              ),
                          }
                        : g,
                ),
            },
        });
        syncToUrl();
    },
}));
