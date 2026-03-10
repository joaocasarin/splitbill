import * as balanceDomain from "@domain/balance";
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

        test("returns users from store", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            expect(result.current).toHaveProperty("users");
            const state = result.current as FoundState;
            expect(state.users).toHaveLength(2);
        });

        test("returns computed members with name and balance", () => {
            const group = setupGroupWithTwoMembers();
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            expect(state.members).toEqual([
                { id: 1, name: "Alice", amount: 0 },
                { id: 2, name: "Bob", amount: 0 },
            ]);
        });

        test("returns memberCount matching group memberIds length", () => {
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
        test("falls back to User {id} name when member has no matching user", () => {
            const group = setupGroupWithTwoMembers();
            useAppStore.getState().addMemberToGroup(group.id, 999);
            const { result } = renderHook(() => useGroupScreen(group.id));
            const state = result.current as FoundState;
            const member999 = state.members.find((m) => m.id === 999);
            expect(member999?.name).toBe("User 999");
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
