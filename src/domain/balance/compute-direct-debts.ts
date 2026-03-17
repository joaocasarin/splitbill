import { BPS_TOTAL } from "../common";
import type { Group } from "../group";
import type { DirectDebt } from "./balance.schema";

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
                const membersAmount = expense.memberIds.length;
                const share = Math.floor(expense.total / membersAmount);
                const remainder = expense.total - share * membersAmount;
                const payerIsParticipant = expense.memberIds.includes(
                    expense.payerId,
                );
                let remainderAssigned = payerIsParticipant;

                for (const memberId of expense.memberIds) {
                    if (memberId === expense.payerId) continue;

                    const memberShare = !remainderAssigned
                        ? share + remainder
                        : share;

                    remainderAssigned = true;
                    addDebt(memberId, expense.payerId, memberShare);
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
                const amounts = expense.shares.map((s) =>
                    Math.round((expense.total * s.value) / BPS_TOTAL),
                );
                const remainder =
                    expense.total - amounts.reduce((a, b) => a + b, 0);
                const payerInShares = expense.shares.some(
                    (s) => s.memberId === expense.payerId,
                );
                let remainderAssigned = payerInShares;

                for (let i = 0; i < expense.shares.length; i++) {
                    const share = expense.shares[i];

                    if (share.memberId === expense.payerId) continue;

                    const memberAmount = !remainderAssigned
                        ? amounts[i] + remainder
                        : amounts[i];

                    remainderAssigned = true;
                    addDebt(share.memberId, expense.payerId, memberAmount);
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
