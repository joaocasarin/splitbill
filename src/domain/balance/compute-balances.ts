import type { EntityId } from "../common";
import { BPS_TOTAL } from "../common";
import type { Expense } from "../expense";
import type { Group } from "../group";
import type { Settlement } from "../settlement";
import type { MemberBalance } from "./balance.schema";

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
    const participantCount = memberIds.length;
    const baseShare = Math.floor(total / participantCount);
    const remainder = total - baseShare * participantCount;

    for (const memberId of memberIds) {
        updateBalance(balances, memberId, -baseShare);
    }

    if (remainder !== 0) {
        const remainderTarget = memberIds.includes(payerId)
            ? payerId
            : memberIds[0];
        updateBalance(balances, remainderTarget, -remainder);
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
    const computedShares = shares.map((share) => ({
        memberId: share.memberId,
        value: Math.round((total * share.value) / BPS_TOTAL),
    }));

    const computedSum = computedShares.reduce((acc, s) => acc + s.value, 0);
    const remainder = total - computedSum;

    for (const { memberId, value } of computedShares) {
        updateBalance(balances, memberId, -value);
    }

    if (remainder !== 0) {
        const remainderTarget = computedShares.some(
            (s) => s.memberId === payerId,
        )
            ? payerId
            : computedShares[0].memberId;
        updateBalance(balances, remainderTarget, -remainder);
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
 * are absorbed by the payer when the payer is a participant, otherwise by the
 * first participant in the list — this ensures symmetric expenses cancel out.
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
