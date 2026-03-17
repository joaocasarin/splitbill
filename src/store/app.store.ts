import { computeBalances, computeDirectDebts } from "@domain/balance";
import {
    createIdGenerator,
    type EntityId,
    GROUP_MEMBERS_MIN,
    SCHEMA_VERSION,
} from "@domain/common";
import type { CreateExpense, Expense } from "@domain/expense";
import { type Global, GlobalSchema } from "@domain/global";
import type { Group } from "@domain/group";
import type { Member } from "@domain/member";
import {
    type CreateSettlement,
    type Settlement,
    type ValidationResult,
    validateSettlementCreation,
    validateSettlementsStillValid,
} from "@domain/settlement";
import type { User } from "@domain/user";
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
    addUser: (name: string) => void;
    addGroup: (name: string, memberIds: EntityId[]) => void;
    addGroupWithMembers: (name: string, memberNames: string[]) => void;
    addMemberToGroup: (groupId: EntityId, userId: EntityId) => void;
    addMemberByName: (groupId: EntityId, name: string) => void;
    removeMemberFromGroup: (
        groupId: EntityId,
        userId: EntityId,
    ) => ValidationResult;
    addExpense: (groupId: EntityId, expense: CreateExpense) => void;
    updateExpense: (groupId: EntityId, expense: Expense) => ValidationResult;
    deleteExpense: (groupId: EntityId, expenseId: EntityId) => ValidationResult;
    addSettlement: (
        groupId: EntityId,
        settlement: CreateSettlement,
    ) => ValidationResult;
    updateSettlement: (
        groupId: EntityId,
        settlement: Settlement,
    ) => ValidationResult;
    deleteSettlement: (
        groupId: EntityId,
        settlementId: EntityId,
    ) => ValidationResult;
};

export type AppStore = AppState & AppActions;

const emptyGlobal: Global = {
    version: SCHEMA_VERSION,
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
    addUser: (name: string) => {
        const { global, createId, syncToUrl } = get();
        const newUser: User = {
            id: createId("user"),
            name,
            createdAt: Date.now(),
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
        const resolvedMembers = memberIds
            .map((id) => global.users.find((u) => u.id === id))
            .filter((u): u is User => u !== undefined)
            .map((u) => ({
                id: createId("member"),
                name: u.name,
                createdAt: Date.now(),
            }));
        const newGroup: Group = {
            id: createId("group"),
            name,
            createdAt: Date.now(),
            memberIds,
            members:
                resolvedMembers.length >= GROUP_MEMBERS_MIN
                    ? resolvedMembers
                    : undefined,
            expenses: [],
            settlements: [],
        };
        set({
            status: "loaded",
            global: { ...global, groups: [...global.groups, newGroup] },
        });
        syncToUrl();
    },
    addGroupWithMembers: (name: string, memberNames: string[]) => {
        const { global, createId, syncToUrl } = get();
        const memberIds: EntityId[] = [];
        const members: Member[] = memberNames.map((memberName) => {
            const id = createId("member");

            memberIds.push(id);

            return {
                id,
                name: memberName,
                createdAt: Date.now(),
            };
        });
        const newGroup: Group = {
            id: createId("group"),
            name,
            createdAt: Date.now(),
            memberIds,
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
    addMemberToGroup: (groupId: EntityId, userId: EntityId) => {
        const { global, createId, syncToUrl } = get();
        const user = global.users.find((u) => u.id === userId);
        const newMember: Member | undefined = user
            ? { id: createId("member"), name: user.name, createdAt: Date.now() }
            : undefined;
        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) => {
                    if (g.id !== groupId || g.memberIds.includes(userId)) {
                        return g;
                    }
                    return {
                        ...g,
                        memberIds: [...g.memberIds, userId],
                        members:
                            newMember !== undefined
                                ? [...(g.members ?? []), newMember]
                                : g.members,
                    };
                }),
            },
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
                              memberIds: [...g.memberIds, memberId],
                              members: [...(g.members ?? []), newMember],
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

        if (!group.memberIds.includes(userId)) {
            return { valid: false, reason: "member not found in group" };
        }

        if (group.memberIds.length <= GROUP_MEMBERS_MIN) {
            return {
                valid: false,
                reason: "group must have at least 2 members",
            };
        }

        const balances = computeBalances(group);
        const memberBalance = balances.find((b) => b.memberId === userId);

        if (memberBalance && memberBalance.amount !== 0) {
            return { valid: false, reason: "member has non-zero balance" };
        }

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              memberIds: g.memberIds.filter(
                                  (id) => id !== userId,
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
    deleteExpense: (
        groupId: EntityId,
        expenseId: EntityId,
    ): ValidationResult => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

        const groupWithoutExpense: Group = {
            ...group,
            expenses: group.expenses.filter((e) => e.id !== expenseId),
        };

        const directDebts = computeDirectDebts(groupWithoutExpense);
        const settlementCheck = validateSettlementsStillValid(
            directDebts,
            group.settlements,
        );

        if (!settlementCheck.valid) {
            return settlementCheck;
        }

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId ? groupWithoutExpense : g,
                ),
            },
        });
        syncToUrl();

        return { valid: true };
    },
    updateExpense: (groupId: EntityId, expense: Expense): ValidationResult => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

        const groupWithUpdatedExpense: Group = {
            ...group,
            expenses: group.expenses.map((e) =>
                e.id === expense.id ? { ...expense, updatedAt: Date.now() } : e,
            ),
        };

        const directDebts = computeDirectDebts(groupWithUpdatedExpense);
        const settlementCheck = validateSettlementsStillValid(
            directDebts,
            group.settlements,
        );

        if (!settlementCheck.valid) {
            return settlementCheck;
        }

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((g) =>
                    g.id === groupId ? groupWithUpdatedExpense : g,
                ),
            },
        });
        syncToUrl();

        return { valid: true };
    },
    addSettlement: (groupId: EntityId, settlement: CreateSettlement) => {
        const { global, createId, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

        const directDebts = computeDirectDebts(group);

        const validation = validateSettlementCreation(
            directDebts,
            settlement.fromMemberId,
            settlement.toMemberId,
            settlement.amount,
        );

        if (!validation.valid) {
            return validation;
        }

        const newSettlement: Settlement = {
            ...settlement,
            id: createId("settlement"),
            createdAt: Date.now(),
        };

        set({
            status: "loaded",
            global: {
                ...global,
                groups: global.groups.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              settlements: [
                                  ...group.settlements,
                                  newSettlement,
                              ],
                          }
                        : group,
                ),
            },
        });

        syncToUrl();

        return { valid: true };
    },
    updateSettlement: (
        groupId: EntityId,
        settlement: Settlement,
    ): ValidationResult => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

        const groupWithoutSettlement: Group = {
            ...group,
            settlements: group.settlements.filter(
                (s) => s.id !== settlement.id,
            ),
        };

        const directDebts = computeDirectDebts(groupWithoutSettlement);

        const validation = validateSettlementCreation(
            directDebts,
            settlement.fromMemberId,
            settlement.toMemberId,
            settlement.amount,
        );

        if (!validation.valid) {
            return validation;
        }

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

        return { valid: true };
    },
    deleteSettlement: (
        groupId: EntityId,
        settlementId: EntityId,
    ): ValidationResult => {
        const { global, syncToUrl } = get();

        const group = global.groups.find((g) => g.id === groupId);

        if (!group) {
            return { valid: false, reason: "group not found" };
        }

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

        return { valid: true };
    },
}));
