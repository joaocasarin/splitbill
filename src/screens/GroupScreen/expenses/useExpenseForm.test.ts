import {
    BPS_TOTAL,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "@domain/common";
import * as expenseDomain from "@domain/expense";
import { useAppStore } from "@store";
import { act, renderHook } from "@testing-library/react";
import { setupGroupWithTwoMembers } from "@tests/helpers";
import { setupStoreOnly } from "@tests/setup";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useExpenseForm } from "./useExpenseForm";

beforeEach(() => {
    setupStoreOnly();
});

function setup(onClose = vi.fn()) {
    const group = setupGroupWithTwoMembers();
    const hook = renderHook(() => useExpenseForm(group.id, onClose));
    return { group, onClose, hook };
}

describe("useExpenseForm", () => {
    describe("initial state", () => {
        test("members are derived from the store", () => {
            const { hook } = setup();
            expect(hook.result.current.members).toEqual([
                { id: 1, name: "Alice" },
                { id: 2, name: "Bob" },
            ]);
        });

        test("title is empty string", () => {
            const { hook } = setup();
            expect(hook.result.current.title).toBe("");
        });

        test("total is 0", () => {
            const { hook } = setup();
            expect(hook.result.current.total).toBe(0);
        });

        test("splitMode is equal", () => {
            const { hook } = setup();
            expect(hook.result.current.splitMode).toBe("equal");
        });

        test("payerId is first member id", () => {
            const { hook } = setup();
            expect(hook.result.current.payerId).toBe(1);
        });

        test("participantIds contains first member", () => {
            const { hook } = setup();
            expect(hook.result.current.participantIds).toEqual(new Set([1]));
        });

        test("fixedShares initialized to 0 for each member", () => {
            const { hook } = setup();
            expect(hook.result.current.fixedShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });

        test("percentageShares initialized to 0 for each member", () => {
            const { hook } = setup();
            expect(hook.result.current.percentageShares).toEqual(
                new Map([
                    [1, 0],
                    [2, 0],
                ]),
            );
        });

        test("canCreate is false", () => {
            const { hook } = setup();
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("members is empty when group does not exist", () => {
            const onClose = vi.fn();
            const hook = renderHook(() => useExpenseForm(999, onClose));
            expect(hook.result.current.members).toEqual([]);
        });
    });

    describe("members resolution", () => {
        test("falls back to User {id} when user has no match", () => {
            const onClose = vi.fn();
            useAppStore.getState().addUser("Alice");
            useAppStore.getState().addUser("Bob");
            useAppStore.getState().addGroup("Trip", [1, 2]);
            useAppStore.getState().addMemberToGroup(1, 999);
            const group = useAppStore.getState().global.groups[0];
            const hook = renderHook(() => useExpenseForm(group.id, onClose));
            expect(
                hook.result.current.members.find((m) => m.id === 999)?.name,
            ).toBe("User 999");
        });
    });

    describe("setTitle", () => {
        test("updates title", () => {
            const { hook } = setup();
            act(() => hook.result.current.setTitle("Hotel"));
            expect(hook.result.current.title).toBe("Hotel");
        });
    });

    describe("setTotal", () => {
        test("updates total", () => {
            const { hook } = setup();
            act(() => hook.result.current.setTotal(1000));
            expect(hook.result.current.total).toBe(1000);
        });
    });

    describe("setSplitMode", () => {
        test("updates splitMode", () => {
            const { hook } = setup();
            act(() => hook.result.current.setSplitMode("fixed"));
            expect(hook.result.current.splitMode).toBe("fixed");
        });
    });

    describe("handlePayerChange", () => {
        test("updates payerId", () => {
            const { hook } = setup();
            act(() => hook.result.current.handlePayerChange(2));
            expect(hook.result.current.payerId).toBe(2);
        });

        test("adds new payer to participantIds", () => {
            const { hook } = setup();
            act(() => hook.result.current.handlePayerChange(2));
            expect(hook.result.current.participantIds.has(2)).toBe(true);
        });
    });

    describe("toggleParticipant", () => {
        test("adds participant when not present", () => {
            const { hook } = setup();
            act(() => hook.result.current.toggleParticipant(2));
            expect(hook.result.current.participantIds.has(2)).toBe(true);
        });

        test("removes participant when already present", () => {
            const { hook } = setup();
            act(() => hook.result.current.toggleParticipant(1));
            expect(hook.result.current.participantIds.has(1)).toBe(false);
        });
    });

    describe("handleFixedShareChange", () => {
        test("updates fixedShares for given member", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFixedShareChange(2, 500));
            expect(hook.result.current.fixedShares.get(2)).toBe(500);
        });
    });

    describe("handlePercentageShareChange", () => {
        test("stores value as basis points (multiplied by 100)", () => {
            const { hook } = setup();
            act(() => hook.result.current.handlePercentageShareChange(1, 50));
            expect(hook.result.current.percentageShares.get(1)).toBe(5000);
        });

        test("rounds fractional basis points", () => {
            const { hook } = setup();
            act(() =>
                hook.result.current.handlePercentageShareChange(1, 33.333),
            );
            expect(hook.result.current.percentageShares.get(1)).toBe(3333);
        });
    });

    describe("canCreate — equal split", () => {
        test("false when title is too short", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hi");
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("false when title is too long", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("A".repeat(EXPENSE_TITLE_MAX + 1));
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("false when total is 0", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.toggleParticipant(2);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("false when only payer is participant", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(100);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test(`true when title has exactly ${EXPENSE_TITLE_MIN} chars, total > 0, and non-payer participant`, () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("A".repeat(EXPENSE_TITLE_MIN));
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            expect(hook.result.current.canCreate).toBe(true);
        });
    });

    describe("canCreate — fixed split", () => {
        test("false when shares do not sum to total", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("fixed");
                hook.result.current.handleFixedShareChange(2, 500);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("false when no non-payer has a share", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("fixed");
                hook.result.current.handleFixedShareChange(1, 1000);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("true when shares sum to total and non-payer has share", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("fixed");
                hook.result.current.handleFixedShareChange(1, 600);
                hook.result.current.handleFixedShareChange(2, 400);
            });
            expect(hook.result.current.canCreate).toBe(true);
        });
    });

    describe("canCreate — percentage split", () => {
        test("false when percentages do not sum to 100%", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                hook.result.current.handlePercentageShareChange(2, 50);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("false when no non-payer has a percentage", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                hook.result.current.handlePercentageShareChange(1, 100);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });

        test("true when percentages sum to 100% and non-payer has share", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                hook.result.current.handlePercentageShareChange(1, 50);
                hook.result.current.handlePercentageShareChange(2, 50);
            });
            expect(hook.result.current.canCreate).toBe(true);
        });
    });

    describe("handleCreate", () => {
        test("calls addExpense and onClose for equal split", () => {
            const { group, onClose, hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            act(() => hook.result.current.handleCreate());
            const expenses = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id)?.expenses;
            expect(expenses).toHaveLength(1);
            expect(expenses?.[0]).toMatchObject({
                title: "Hotel",
                splitMode: "equal",
            });
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("calls addExpense for fixed split", () => {
            const { group, hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("fixed");
                hook.result.current.handleFixedShareChange(1, 600);
                hook.result.current.handleFixedShareChange(2, 400);
            });
            act(() => hook.result.current.handleCreate());
            const expenses = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id)?.expenses;
            expect(expenses?.[0]).toMatchObject({ splitMode: "fixed" });
        });

        test("calls addExpense for percentage split", () => {
            const { group, hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                hook.result.current.handlePercentageShareChange(1, 50);
                hook.result.current.handlePercentageShareChange(2, 50);
            });
            act(() => hook.result.current.handleCreate());
            const expenses = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id)?.expenses;
            expect(expenses?.[0]).toMatchObject({ splitMode: "percentage" });
        });

        test("resets form after creating", () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            act(() => hook.result.current.handleCreate());
            expect(hook.result.current.title).toBe("");
            expect(hook.result.current.total).toBe(0);
            expect(hook.result.current.splitMode).toBe("equal");
        });

        test("trims title whitespace when building expense", () => {
            const { group, hook } = setup();
            act(() => {
                hook.result.current.setTitle("  Hotel  ");
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            act(() => hook.result.current.handleCreate());
            const expense = useAppStore
                .getState()
                .global.groups.find((g) => g.id === group.id)?.expenses[0];
            expect(expense?.title).toBe("Hotel");
        });
    });

    describe("handleOpenChange", () => {
        test("calls reset and onClose when next is false", () => {
            const { onClose, hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.handleOpenChange(false);
            });
            expect(hook.result.current.title).toBe("");
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("is a no-op when next is true", () => {
            const { onClose, hook } = setup();
            act(() => hook.result.current.handleOpenChange(true));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("reset sets participantIds to empty set when group has no members", () => {
            const onClose = vi.fn();
            const hook = renderHook(() => useExpenseForm(999, onClose));
            act(() => hook.result.current.handleOpenChange(false));
            expect(hook.result.current.participantIds).toEqual(new Set());
        });

        test("handleCreate returns early when buildEqualExpense returns null", () => {
            const { onClose, hook } = setup();
            vi.spyOn(expenseDomain, "buildEqualExpense").mockReturnValueOnce(
                null,
            );
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(100);
                hook.result.current.toggleParticipant(2);
            });
            act(() => hook.result.current.handleCreate());
            expect(onClose).not.toHaveBeenCalled();
        });

        test("handleCreate returns early when buildFixedExpense returns null", () => {
            const { onClose, hook } = setup();
            vi.spyOn(expenseDomain, "buildFixedExpense").mockReturnValueOnce(
                null,
            );
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("fixed");
                hook.result.current.handleFixedShareChange(1, 600);
                hook.result.current.handleFixedShareChange(2, 400);
            });
            act(() => hook.result.current.handleCreate());
            expect(onClose).not.toHaveBeenCalled();
        });

        test("handleCreate returns early when buildPercentageExpense returns null", () => {
            const { onClose, hook } = setup();
            vi.spyOn(
                expenseDomain,
                "buildPercentageExpense",
            ).mockReturnValueOnce(null);
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                hook.result.current.handlePercentageShareChange(1, 50);
                hook.result.current.handlePercentageShareChange(2, 50);
            });
            act(() => hook.result.current.handleCreate());
            expect(onClose).not.toHaveBeenCalled();
        });

        test(`canCreate uses BPS_TOTAL (${BPS_TOTAL}) as percentage threshold`, () => {
            const { hook } = setup();
            act(() => {
                hook.result.current.setTitle("Hotel");
                hook.result.current.setTotal(1000);
                hook.result.current.setSplitMode("percentage");
                // 9999 bps — one short of BPS_TOTAL
                hook.result.current.handlePercentageShareChange(1, 49.99);
                hook.result.current.handlePercentageShareChange(2, 50);
            });
            expect(hook.result.current.canCreate).toBe(false);
        });
    });
});
