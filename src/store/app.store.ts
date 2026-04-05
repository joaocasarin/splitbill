import { computeBalances } from "@domain/balance";
import {
    createIdGenerator,
    type EntityId,
    SCHEMA_VERSION,
} from "@domain/common";
import type { CreateExpense, Expense } from "@domain/expense";
import { type Global, parseGlobal } from "@domain/global";
import type { Group } from "@domain/group";
import { type Member, validateMemberDeletion } from "@domain/member";
import {
    type CreateSettlement,
    type Settlement,
    type ValidationResult,
} from "@domain/settlement";
import { showToast } from "@lib/toast";
import lzstring from "lz-string";
import { create } from "zustand";

type AppStatus = "empty" | "loaded" | "error";

type AppState = {
    status: AppStatus;
    error: string | null;
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
    importGlobal: (raw: string) => void;
};

export type AppStore = AppState & AppActions;

const emptyGlobal: Global = {
    version: SCHEMA_VERSION,
    groups: [],
};

export const useAppStore = create<AppStore>()((set, get) => ({
    status: "empty",
    error: null,
    global: emptyGlobal,
    createId: createIdGenerator(emptyGlobal),
    hydrateFromUrl: () => {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("state");

        if (!raw) {
            set({ status: "empty", error: null });
            return;
        }

        const decompressedState =
            lzstring.decompressFromEncodedURIComponent(raw);

        if (!decompressedState) {
            set({
                status: "error",
                error: "Failed to load state from URL: decompression failed",
            });
            return;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(decompressedState);
        } catch {
            set({
                status: "error",
                error: "Failed to load state from URL: invalid JSON",
            });
            return;
        }

        const result = parseGlobal(parsed);
        if (!result.success) {
            set({ status: "error", error: result.error });
            return;
        }

        set({
            status: "loaded",
            error: null,
            global: result.data,
            createId: createIdGenerator(result.data),
        });
    },
    initEmpty: () => {
        set({
            status: "empty",
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
            error: null,
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
    importGlobal: (raw) => {
        const { global } = get();
        try {
            if (global.groups.length !== 0) {
                throw new Error(
                    "Cannot import: existing groups must be cleared first",
                );
            }

            let parsed: unknown;
            try {
                parsed = JSON.parse(raw);
            } catch {
                throw new Error("Import failed: file contains invalid JSON");
            }

            const result = parseGlobal(parsed);
            if (!result.success) {
                throw new Error(result.error);
            }

            if (result.data.version !== SCHEMA_VERSION) {
                throw new Error("Import failed: schema version mismatch");
            }

            const nextId = createIdGenerator(result.data);
            set({
                status: "loaded",
                error: null,
                global: result.data,
                createId: nextId,
            });
            get().syncToUrl();
            showToast.success("File imported successfully");
        } catch (err) {
            showToast.error((err as Error).message);
        }
    },
}));
