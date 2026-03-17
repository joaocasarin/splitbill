import type { DirectDebt } from "@domain/balance";
import * as balanceDomain from "@domain/balance";
import { useAppStore } from "@store";
import { act, renderHook } from "@testing-library/react";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { defaultEqualExpense } from "@tests/mocks";
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

        test("returns users from store", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            expect(result.current).toHaveProperty("users");
            const state = result.current as FoundState;
            expect(state.users).toHaveLength(2);
        });

        test("returns empty members when group has no inline members", () => {
            useAppStore.getState().addGroup("Trip", [998, 999]);
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

        test("returns memberCount matching group.members length", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.memberCount).toBe(2);
        });

        test("canAddMember is false when all users are members", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.canAddMember).toBe(false);
        });

        test("canAddMember is true when non-members exist", () => {
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            const group = useAppStore.getState().global.groups[0];
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

    describe("directDebts", () => {
        test("returns empty array when group has no expenses", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.directDebts).toEqual([]);
        });

        test("returns computed direct debts from group", () => {
            const mockDebts: DirectDebt[] = [
                { fromMemberId: 2, toMemberId: 1, amount: 5000 },
            ];
            vi.spyOn(balanceDomain, "computeDirectDebts").mockReturnValueOnce(
                mockDebts,
            );
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.directDebts).toEqual(mockDebts);
        });
    });

    describe("editDirectDebts", () => {
        test("equals directDebts when editingSettlement is null", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.editDirectDebts).toEqual(state.directDebts);
        });

        test("excludes edited settlement from debt calculation", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addExpense(group.id, {
                ...defaultEqualExpense,
                title: "Lunch",
                total: 2500,
            });
            useAppStore.getState().addSettlement(group.id, {
                fromMemberId: 2,
                toMemberId: 1,
                amount: 1000,
            });
            const { result } = renderHook(() => useGroupScreen(group.id));

            // Before editing: directDebts reflects remaining debt (1250 - 1000 = 250)
            const stateBefore = result.current as FoundState;
            expect(stateBefore.directDebts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 250 },
            ]);
            expect(stateBefore.editDirectDebts).toEqual(
                stateBefore.directDebts,
            );

            // Open edit on the settlement
            const settlement =
                useAppStore.getState().global.groups[0].settlements[0];
            act(() => {
                (result.current as FoundState).openEditSettlement(settlement);
            });

            // After editing: editDirectDebts excludes the settlement (full debt = 1250)
            const stateAfter = result.current as FoundState;
            expect(stateAfter.editDirectDebts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 1250 },
            ]);
            // directDebts is still the same (includes the settlement)
            expect(stateAfter.directDebts).toEqual([
                { fromMemberId: 2, toMemberId: 1, amount: 250 },
            ]);
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
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addUser("Carol");
            useAppStore.getState().addGroup("Trip", [1, 2, 3]);
            const group = useAppStore.getState().global.groups[0];
            const { result } = renderHook(() => useGroupScreen(group.id));
            act(() => {
                (result.current as FoundState).removeMember(1);
            });
            const updatedGroup = useAppStore.getState().global.groups[0];
            expect(updatedGroup.memberIds).not.toContain(1);
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("falls back to 'User {id}' in debt display when debt references unknown member", () => {
            const mockDebts: DirectDebt[] = [
                { fromMemberId: 2, toMemberId: 999, amount: 5000 },
            ];
            vi.spyOn(balanceDomain, "computeDirectDebts").mockReturnValueOnce(
                mockDebts,
            );
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            const bobRow = state.members.find((m) => m.name === "Bob");
            expect(bobRow?.owes[0]?.name).toBe("User 999");
        });

        test("falls back to amount 0 when computeBalances has no entry for member", () => {
            vi.spyOn(balanceDomain, "computeBalances").mockReturnValueOnce([]);
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members.every((m) => m.amount === 0)).toBe(true);
        });
    });
});
