import type { DirectDebt } from "@domain/balance";
import type { CreateSettlement, Settlement } from "@domain/settlement";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { MemberRow } from "../members/MembersSection";
import { useSettlementForm } from "./useSettlementForm";

const alice: MemberRow = {
    id: 1,
    name: "Alice",
    amount: 0,
    owes: [],
    receives: [],
};
const bob: MemberRow = {
    id: 2,
    name: "Bob",
    amount: 0,
    owes: [],
    receives: [],
};
const charlie: MemberRow = {
    id: 3,
    name: "Charlie",
    amount: 0,
    owes: [],
    receives: [],
};
const members: MemberRow[] = [alice, bob, charlie];

const directDebts: DirectDebt[] = [
    { fromMemberId: 1, toMemberId: 2, amount: 5000 },
    { fromMemberId: 1, toMemberId: 3, amount: 3000 },
    { fromMemberId: 3, toMemberId: 2, amount: 1000 },
];

function setup(
    overrides: {
        members?: MemberRow[];
        directDebts?: DirectDebt[];
        onSubmit?: (settlement: CreateSettlement) => void;
        onClose?: () => void;
        settlement?: Settlement;
    } = {},
) {
    const onSubmit = overrides.onSubmit ?? vi.fn();
    const onClose = overrides.onClose ?? vi.fn();
    const hook = renderHook(() =>
        useSettlementForm({
            members: overrides.members ?? members,
            directDebts: overrides.directDebts ?? directDebts,
            onSubmit,
            onClose,
            settlement: overrides.settlement,
        }),
    );
    return { onSubmit, onClose, hook };
}

describe("useSettlementForm", () => {
    describe("initial state", () => {
        test("fromMemberId is null", () => {
            const { hook } = setup();
            expect(hook.result.current.fromMemberId).toBeNull();
        });

        test("toMemberId is null", () => {
            const { hook } = setup();
            expect(hook.result.current.toMemberId).toBeNull();
        });

        test("amount is 0", () => {
            const { hook } = setup();
            expect(hook.result.current.amount).toBe(0);
        });

        test("canSubmit is false", () => {
            const { hook } = setup();
            expect(hook.result.current.canSubmit).toBe(false);
        });

        test("maxAmount is 0", () => {
            const { hook } = setup();
            expect(hook.result.current.maxAmount).toBe(0);
        });

        test("creditorsForDebtor is empty", () => {
            const { hook } = setup();
            expect(hook.result.current.creditorsForDebtor).toEqual([]);
        });
    });

    describe("debtorsWithDebts", () => {
        test("returns only members who owe someone", () => {
            const { hook } = setup();
            expect(hook.result.current.debtorsWithDebts).toEqual([
                alice,
                charlie,
            ]);
        });

        test("returns empty when no debts exist", () => {
            const { hook } = setup({ directDebts: [] });
            expect(hook.result.current.debtorsWithDebts).toEqual([]);
        });
    });

    describe("creditorsForDebtor", () => {
        test("returns creditors with maxAmount when fromMemberId is set", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            expect(hook.result.current.creditorsForDebtor).toEqual([
                { id: 2, name: "Bob", maxAmount: 5000 },
                { id: 3, name: "Charlie", maxAmount: 3000 },
            ]);
        });

        test("falls back to User {id} when member not found", () => {
            const debts: DirectDebt[] = [
                { fromMemberId: 1, toMemberId: 99, amount: 1000 },
            ];
            const { hook } = setup({ directDebts: debts });
            act(() => hook.result.current.handleFromChange(1));
            expect(hook.result.current.creditorsForDebtor).toEqual([
                { id: 99, name: "User 99", maxAmount: 1000 },
            ]);
        });
    });

    describe("maxAmount", () => {
        test("returns debt amount when both from and to are selected", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            expect(hook.result.current.maxAmount).toBe(5000);
        });

        test("returns 0 when no matching debt exists", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(2));
            act(() => hook.result.current.handleToChange(1));
            expect(hook.result.current.maxAmount).toBe(0);
        });
    });

    describe("handleFromChange", () => {
        test("sets fromMemberId", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            expect(hook.result.current.fromMemberId).toBe(1);
        });

        test("resets toMemberId to null", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.handleFromChange(3));
            expect(hook.result.current.toMemberId).toBeNull();
        });

        test("resets amount to 0", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(1000));
            act(() => hook.result.current.handleFromChange(3));
            expect(hook.result.current.amount).toBe(0);
        });
    });

    describe("handleToChange", () => {
        test("sets toMemberId", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleToChange(2));
            expect(hook.result.current.toMemberId).toBe(2);
        });

        test("resets amount to 0", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(1000));
            act(() => hook.result.current.handleToChange(3));
            expect(hook.result.current.amount).toBe(0);
        });
    });

    describe("canSubmit", () => {
        test("true when valid from, to, and amount within debt", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(5000));
            expect(hook.result.current.canSubmit).toBe(true);
        });

        test("false when amount is 0", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            expect(hook.result.current.canSubmit).toBe(false);
        });

        test("false when amount exceeds debt", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(9999));
            expect(hook.result.current.canSubmit).toBe(false);
        });

        test("false when fromMemberId is null", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(1000));
            expect(hook.result.current.canSubmit).toBe(false);
        });

        test("false when toMemberId is null", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.setAmount(1000));
            expect(hook.result.current.canSubmit).toBe(false);
        });

        test("false when no matching debt exists", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(2));
            act(() => hook.result.current.handleToChange(1));
            act(() => hook.result.current.setAmount(1000));
            expect(hook.result.current.canSubmit).toBe(false);
        });
    });

    describe("handleSubmit", () => {
        test("calls onSubmit with settlement data", () => {
            const { onSubmit, hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(3000));
            act(() => hook.result.current.handleSubmit());
            expect(onSubmit).toHaveBeenCalledWith({
                fromMemberId: 1,
                toMemberId: 2,
                amount: 3000,
            });
        });

        test("calls onClose after submit", () => {
            const { onClose, hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(3000));
            act(() => hook.result.current.handleSubmit());
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("resets form after creating", () => {
            const { hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(3000));
            act(() => hook.result.current.handleSubmit());
            expect(hook.result.current.fromMemberId).toBeNull();
            expect(hook.result.current.toMemberId).toBeNull();
            expect(hook.result.current.amount).toBe(0);
        });
    });

    describe("handleOpenChange", () => {
        test("resets and calls onClose when next is false", () => {
            const { onClose, hook } = setup();
            act(() => hook.result.current.handleFromChange(1));
            act(() => hook.result.current.handleToChange(2));
            act(() => hook.result.current.setAmount(1000));
            act(() => hook.result.current.handleOpenChange(false));
            expect(hook.result.current.fromMemberId).toBeNull();
            expect(hook.result.current.toMemberId).toBeNull();
            expect(hook.result.current.amount).toBe(0);
            expect(onClose).toHaveBeenCalledOnce();
        });

        test("is a no-op when next is true", () => {
            const { onClose, hook } = setup();
            act(() => hook.result.current.handleOpenChange(true));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("edit mode", () => {
        const existingSettlement = {
            id: 10,
            fromMemberId: 1,
            toMemberId: 2,
            amount: 3000,
            createdAt: 1000000,
        };

        test("isEditing is true when settlement is provided", () => {
            const { hook } = setup({ settlement: existingSettlement });
            expect(hook.result.current.isEditing).toBe(true);
        });

        test("isEditing is false when no settlement is provided", () => {
            const { hook } = setup();
            expect(hook.result.current.isEditing).toBe(false);
        });

        test("initializes fromMemberId from settlement", () => {
            const { hook } = setup({ settlement: existingSettlement });
            expect(hook.result.current.fromMemberId).toBe(1);
        });

        test("initializes toMemberId from settlement", () => {
            const { hook } = setup({ settlement: existingSettlement });
            expect(hook.result.current.toMemberId).toBe(2);
        });

        test("initializes amount from settlement", () => {
            const { hook } = setup({ settlement: existingSettlement });
            expect(hook.result.current.amount).toBe(3000);
        });

        test("canSubmit is true when settlement values are valid", () => {
            const { hook } = setup({ settlement: existingSettlement });
            expect(hook.result.current.canSubmit).toBe(true);
        });

        test("handleSubmit calls onSubmit with current form data", () => {
            const { onSubmit, hook } = setup({
                settlement: existingSettlement,
            });
            act(() => hook.result.current.handleSubmit());
            expect(onSubmit).toHaveBeenCalledWith({
                fromMemberId: 1,
                toMemberId: 2,
                amount: 3000,
            });
        });
    });

    describe("defensive guards (unreachable in valid usage)", () => {
        test("handleSubmit is a no-op when canSubmit is false", () => {
            const { onSubmit, onClose, hook } = setup();
            act(() => hook.result.current.handleSubmit());
            expect(onSubmit).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });
    });
});
