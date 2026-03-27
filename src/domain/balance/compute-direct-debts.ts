import type { Group } from "../group";
import type { DirectDebt } from "./balance.schema";
import { computeEqualShares, computePercentageShares } from "./compute-shares";

export function computeDirectDebts(group: Group): DirectDebt[] {
    const debts = new Map<string, number>();

    function getKey(from: number, to: number) {
        return `${from}-${to}`;
    }

    function addDebt(from: number, to: number, amount: number) {
        const key = getKey(from, to);
        debts.set(key, (debts.get(key) ?? 0) + amount);
    }

    for (const expense of group.expenses) {
        switch (expense.splitMode) {
            case "equal": {
                const shares = computeEqualShares(
                    expense.memberIds,
                    expense.total,
                    expense.payerId,
                );
                for (const [memberId, share] of shares) {
                    if (memberId === expense.payerId) continue;
                    addDebt(memberId, expense.payerId, share);
                }
                break;
            }
            case "fixed":
                for (const share of expense.shares) {
                    if (share.memberId === expense.payerId) continue;

                    addDebt(share.memberId, expense.payerId, share.value);
                }
                break;
            case "percentage": {
                const computed = computePercentageShares(
                    expense.shares,
                    expense.total,
                    expense.payerId,
                );
                for (const [memberId, amount] of computed) {
                    if (memberId === expense.payerId) continue;
                    addDebt(memberId, expense.payerId, amount);
                }
                break;
            }
        }
    }

    for (const settlement of group.settlements) {
        addDebt(
            settlement.fromMemberId,
            settlement.toMemberId,
            -settlement.amount,
        );
    }

    for (const [key, amount] of debts.entries()) {
        const [from, to] = key.split("-").map(Number);
        const reverseKey = getKey(to, from);
        const reverseAmount = debts.get(reverseKey) ?? 0;
        if (reverseAmount > 0 && amount > 0) {
            if (amount >= reverseAmount) {
                debts.set(key, amount - reverseAmount);
                debts.set(reverseKey, 0);
            }
        }
    }

    return Array.from(debts.entries())
        .filter(([, amount]) => amount > 0)
        .map(([key, amount]) => {
            const [from, to] = key.split("-").map(Number);
            return { fromMemberId: from, toMemberId: to, amount };
        });
}
