import type { EntityId } from "../common";
import type { Expense } from "../expense";
import type { Group } from "../group";
import type { Settlement } from "../settlement";
import type { MemberBalance } from "./balance.schema";
import { computeEqualShares, computePercentageShares } from "./compute-shares";

function initializeBalances(memberIds: EntityId[]): Map<EntityId, number> {
    const balances = new Map<EntityId, number>();
    for (const memberId of memberIds) {
        balances.set(memberId, 0);
    }
    return balances;
}

function updateBalance(
    balances: Map<EntityId, number>,
    memberId: EntityId,
    delta: number,
): void {
    balances.set(memberId, (balances.get(memberId) ?? 0) + delta);
}

function applyExpensePayment(
    balances: Map<EntityId, number>,
    payerId: EntityId,
    amount: number,
): void {
    updateBalance(balances, payerId, amount);
}

function applyEqualSplit(
    balances: Map<EntityId, number>,
    memberIds: EntityId[],
    total: number,
    payerId: EntityId,
): void {
    const shares = computeEqualShares(memberIds, total, payerId);
    for (const [memberId, share] of shares) {
        updateBalance(balances, memberId, -share);
    }
}

function applyFixedSplit(
    balances: Map<EntityId, number>,
    shares: Array<{ memberId: EntityId; value: number }>,
): void {
    for (const share of shares) {
        updateBalance(balances, share.memberId, -share.value);
    }
}

function applyPercentageSplit(
    balances: Map<EntityId, number>,
    shares: Array<{ memberId: EntityId; value: number }>,
    total: number,
    payerId: EntityId,
): void {
    const computed = computePercentageShares(shares, total, payerId);
    for (const [memberId, amount] of computed) {
        updateBalance(balances, memberId, -amount);
    }
}

function applyExpense(balances: Map<EntityId, number>, expense: Expense): void {
    applyExpensePayment(balances, expense.payerId, expense.total);

    switch (expense.splitMode) {
        case "equal":
            applyEqualSplit(
                balances,
                expense.memberIds,
                expense.total,
                expense.payerId,
            );
            break;
        case "fixed":
            applyFixedSplit(balances, expense.shares);
            break;
        case "percentage":
            applyPercentageSplit(
                balances,
                expense.shares,
                expense.total,
                expense.payerId,
            );
            break;
    }
}

function applySettlement(
    balances: Map<EntityId, number>,
    settlement: Settlement,
): void {
    updateBalance(balances, settlement.fromMemberId, settlement.amount);
    updateBalance(balances, settlement.toMemberId, -settlement.amount);
}

function balancesToArray(balances: Map<EntityId, number>): MemberBalance[] {
    return Array.from(balances.entries()).map(([memberId, amount]) => ({
        memberId,
        amount,
    }));
}

/**
 * Computes the net balance of each member in a group.
 *
 * Remainder cents (equal split) and rounding remainders (percentage split)
 * are distributed one cent at a time: the payer absorbs the first cent (when
 * a participant), then each subsequent cent goes to the next non-payer in
 * order — this ensures symmetric expenses cancel out.
 *
 * Invariant: sum of all returned amounts === 0.
 */
export function computeBalances(group: Group): MemberBalance[] {
    const balances = initializeBalances(group.members.map((m) => m.id));

    for (const expense of group.expenses) {
        applyExpense(balances, expense);
    }

    for (const settlement of group.settlements) {
        applySettlement(balances, settlement);
    }

    return balancesToArray(balances);
}
