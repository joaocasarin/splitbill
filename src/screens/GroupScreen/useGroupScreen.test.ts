import type { DirectDebt } from "@domain/balance";
import * as balanceDomain from "@domain/balance";
import { GROUP_MEMBERS_MAX } from "@domain/common";
import { useAppStore } from "@store";
import { act, renderHook } from "@testing-library/react";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { UseGroupScreenReturn } from "./useGroupScreen";
import { useGroupScreen } from "./useGroupScreen";

type FoundState = Extract<
    UseGroupScreenReturn,
    { group: NonNullable<UseGroupScreenReturn["group"]> }
>;

beforeEach(() => {
    setupStoreOnly();
});

describe("useGroupScreen", () => {
    describe("group not found", () => {
        test("returns group null when group does not exist", () => {
            const { result } = renderHook(() => useGroupScreen(999));
            expect(result.current.group).toBeNull();
        });
    });

    describe("group found", () => {
        test("returns group object", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            expect(result.current.group).not.toBeNull();
            expect(result.current.group?.name).toBe("Trip");
        });

        test("returns empty members when group has no inline members", () => {
            useAppStore.getState().addGroupWithMembers("Trip", []);
            const group = useAppStore.getState().global.groups[0];
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members).toEqual([]);
            expect(state.memberCount).toBe(0);
        });

        test("returns computed members with name and balance", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members).toEqual([
                { id: 1, name: "Alice", amount: 0, owes: [], receives: [] },
                { id: 2, name: "Bob", amount: 0, owes: [], receives: [] },
            ]);
        });

        test("returns memberCount equal to active member count", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.memberCount).toBe(2);
        });

        test("excludes deleted members from members list", () => {
            useAppStore
                .getState()
                .addGroupWithMembers("Trip", ["Alice", "Bob", "Carol"]);
            const group = useAppStore.getState().global.groups[0];
            useAppStore.getState().removeMemberFromGroup(group.id, 3);
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members).toHaveLength(2);
            expect(
                state.members.find((m) => m.name === "Carol"),
            ).toBeUndefined();
        });

        test("memberCount counts only active members", () => {
            useAppStore
                .getState()
                .addGroupWithMembers("Trip", ["Alice", "Bob", "Carol"]);
            const group = useAppStore.getState().global.groups[0];
            useAppStore.getState().removeMemberFromGroup(group.id, 3);
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.memberCount).toBe(2);
        });

        test("canAddMember is true when below GROUP_MEMBERS_MAX", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.canAddMember).toBe(true);
        });

        test("canAddMember is false when at GROUP_MEMBERS_MAX", () => {
            useAppStore.getState().addGroupWithMembers(
                "Trip",
                Array.from(
                    { length: GROUP_MEMBERS_MAX },
                    (_, i) => `Member${i + 1}`,
                ),
            );
            const group = useAppStore.getState().global.groups[0];
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.canAddMember).toBe(false);
        });

        test("canAddMember counts only active members", () => {
            useAppStore.getState().addGroupWithMembers(
                "Trip",
                Array.from(
                    { length: GROUP_MEMBERS_MAX },
                    (_, i) => `Member${i + 1}`,
                ),
            );
            const group = useAppStore.getState().global.groups[0];
            useAppStore
                .getState()
                .removeMemberFromGroup(group.id, GROUP_MEMBERS_MAX);
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.canAddMember).toBe(true);
        });
    });

    describe("modal state", () => {
        test("isAddMemberOpen defaults to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.isAddMemberOpen).toBe(false);
        });

        test("openAddMember sets isAddMemberOpen to true", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddMember();
            });
            expect((result.current as FoundState).isAddMemberOpen).toBe(true);
        });

        test("closeAddMember sets isAddMemberOpen to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddMember();
            });
            act(() => {
                (result.current as FoundState).closeAddMember();
            });
            expect((result.current as FoundState).isAddMemberOpen).toBe(false);
        });

        test("isAddExpenseOpen defaults to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.isAddExpenseOpen).toBe(false);
        });

        test("openAddExpense sets isAddExpenseOpen to true", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddExpense();
            });
            expect((result.current as FoundState).isAddExpenseOpen).toBe(true);
        });

        test("closeAddExpense sets isAddExpenseOpen to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddExpense();
            });
            act(() => {
                (result.current as FoundState).closeAddExpense();
            });
            expect((result.current as FoundState).isAddExpenseOpen).toBe(false);
        });

        test("editingExpense defaults to null", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.editingExpense).toBeNull();
        });

        test("openEditExpense sets editingExpense", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const expense = {
                id: 1,
                title: "Hotel",
                total: 10000,
                payerId: 1,
                splitMode: "equal" as const,
                memberIds: [1, 2],
                createdAt: 1000000,
            };
            act(() => {
                (result.current as FoundState).openEditExpense(expense);
            });
            expect((result.current as FoundState).editingExpense).toEqual(
                expense,
            );
        });

        test("closeEditExpense sets editingExpense to null", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const expense = {
                id: 1,
                title: "Hotel",
                total: 10000,
                payerId: 1,
                splitMode: "equal" as const,
                memberIds: [1, 2],
                createdAt: 1000000,
            };
            act(() => {
                (result.current as FoundState).openEditExpense(expense);
            });
            act(() => {
                (result.current as FoundState).closeEditExpense();
            });
            expect((result.current as FoundState).editingExpense).toBeNull();
        });

        test("isAddSettlementOpen defaults to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.isAddSettlementOpen).toBe(false);
        });

        test("openAddSettlement sets isAddSettlementOpen to true", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddSettlement();
            });
            expect((result.current as FoundState).isAddSettlementOpen).toBe(
                true,
            );
        });

        test("closeAddSettlement sets isAddSettlementOpen to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).openAddSettlement();
            });
            act(() => {
                (result.current as FoundState).closeAddSettlement();
            });
            expect((result.current as FoundState).isAddSettlementOpen).toBe(
                false,
            );
        });

        test("editingSettlement defaults to null", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.editingSettlement).toBeNull();
        });

        test("openEditSettlement sets editingSettlement", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const settlement = {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
                createdAt: 1000000,
            };
            act(() => {
                (result.current as FoundState).openEditSettlement(settlement);
            });
            expect((result.current as FoundState).editingSettlement).toEqual(
                settlement,
            );
        });

        test("closeEditSettlement sets editingSettlement to null", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const settlement = {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
                createdAt: 1000000,
            };
            act(() => {
                (result.current as FoundState).openEditSettlement(settlement);
            });
            act(() => {
                (result.current as FoundState).closeEditSettlement();
            });
            expect((result.current as FoundState).editingSettlement).toBeNull();
        });
    });

    describe("isSimplifiedView", () => {
        test("defaults to false", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.isSimplifiedView).toBe(false);
        });

        test("toggleSimplifiedView sets isSimplifiedView to true", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).toggleSimplifiedView();
            });
            expect((result.current as FoundState).isSimplifiedView).toBe(true);
        });

        test("toggleSimplifiedView toggles back to false on second call", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).toggleSimplifiedView();
            });
            act(() => {
                (result.current as FoundState).toggleSimplifiedView();
            });
            expect((result.current as FoundState).isSimplifiedView).toBe(false);
        });

        test("members owes come from directDebts when isSimplifiedView is false", () => {
            const mockDirect: DirectDebt[] = [
                { fromMemberId: 2, toMemberId: 1, amount: 5000 },
            ];
            vi.spyOn(balanceDomain, "computeDirectDebts").mockReturnValue(
                mockDirect,
            );
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            const bobRow = state.members.find((m) => m.name === "Bob");
            expect(bobRow?.owes[0]).toEqual({ name: "Alice", amount: 5000 });
        });

        test("members owes come from simplifiedDebts when isSimplifiedView is true", () => {
            vi.spyOn(balanceDomain, "simplifyDebts").mockReturnValue([
                { fromMemberId: 1, toMemberId: 2, amount: 3000 },
            ]);
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).toggleSimplifiedView();
            });
            const state = result.current as FoundState;
            const aliceRow = state.members.find((m) => m.name === "Alice");
            expect(aliceRow?.owes[0]).toEqual({ name: "Bob", amount: 3000 });
        });
    });

    describe("addSettlement", () => {
        test("delegates to store addSettlement", () => {
            const group = setupGroupWithTwoMembers();
            const spy = vi.spyOn(useAppStore.getState(), "addSettlement");
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            act(() => {
                state.addSettlement({
                    fromMemberId: 2,
                    toMemberId: 1,
                    amount: 5000,
                });
            });
            expect(spy).toHaveBeenCalledWith(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
            });
        });
    });

    describe("updateSettlement", () => {
        test("delegates to store updateSettlement", () => {
            const group = setupGroupWithTwoMembers();
            const spy = vi.spyOn(useAppStore.getState(), "updateSettlement");
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            const settlement = {
                id: 1,
                fromMemberId: 2,
                toMemberId: 1,
                amount: 5000,
                createdAt: 1000000,
            };
            act(() => {
                state.updateSettlement(settlement);
            });
            expect(spy).toHaveBeenCalledWith(group.id, settlement);
        });
    });

    describe("deleteExpense", () => {
        test("delegates to store deleteExpense", () => {
            const group = setupGroupWithTwoMembers();
            const spy = vi.spyOn(useAppStore.getState(), "deleteExpense");
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            act(() => {
                state.deleteExpense(1);
            });
            expect(spy).toHaveBeenCalledWith(group.id, 1);
        });
    });

    describe("deleteSettlement", () => {
        test("delegates to store deleteSettlement", () => {
            const group = setupGroupWithTwoMembers();
            const spy = vi.spyOn(useAppStore.getState(), "deleteSettlement");
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            act(() => {
                state.deleteSettlement(1);
            });
            expect(spy).toHaveBeenCalledWith(group.id, 1);
        });
    });

    describe("removeMember", () => {
        test("removes member from group via store", () => {
            useAppStore
                .getState()
                .addGroupWithMembers("Trip", ["Alice", "Bob", "Carol"]);
            const group = useAppStore.getState().global.groups[0];
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).removeMember(1);
            });
            const updatedGroup = useAppStore.getState().global.groups[0];
            const removed = updatedGroup.members.find((m) => m.id === 1);
            expect(removed).toBeDefined();
            expect(removed?.deletedAt).toBeDefined();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to 'User {id}' in direct debt display when member is unknown", () => {
            const mockDebts: DirectDebt[] = [
                { fromMemberId: 2, toMemberId: 999, amount: 5000 },
            ];
            vi.spyOn(balanceDomain, "computeDirectDebts").mockReturnValue(
                mockDebts,
            );
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            const bobRow = state.members.find((m) => m.name === "Bob");
            expect(bobRow?.owes[0]?.name).toBe("User 999");
        });

        test("falls back to 'User {id}' in simplified debt display when member is unknown", () => {
            vi.spyOn(balanceDomain, "simplifyDebts").mockReturnValue([
                { fromMemberId: 2, toMemberId: 999, amount: 5000 },
            ]);
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).toggleSimplifiedView();
            });
            const state = result.current as FoundState;
            const bobRow = state.members.find((m) => m.name === "Bob");
            expect(bobRow?.owes[0]?.name).toBe("User 999");
        });

        test("falls back to amount 0 when computeBalances has no entry for member", () => {
            vi.spyOn(balanceDomain, "computeBalances").mockReturnValue([]);
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members.every((m) => m.amount === 0)).toBe(true);
        });
    });
});
