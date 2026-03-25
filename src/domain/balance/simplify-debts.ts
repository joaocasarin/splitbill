import type { MemberBalance, SimplifiedDebt } from "./balance.schema";

export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
    const creditors = balances
        .filter((b) => b.amount > 0)
        .map((b) => ({ memberId: b.memberId, amount: b.amount }));

    const debtors = balances
        .filter((b) => b.amount < 0)
        .map((b) => ({ memberId: b.memberId, amount: b.amount }));

    // Largest creditor first, most-negative debtor first
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount);

    const result: SimplifiedDebt[] = [];

    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
        const creditor = creditors[ci];
        const debtor = debtors[di];
        const settled = Math.min(creditor.amount, Math.abs(debtor.amount));

        result.push({
            fromMemberId: debtor.memberId,
            toMemberId: creditor.memberId,
            amount: settled,
        });

        creditor.amount -= settled;
        debtor.amount += settled;

        if (creditor.amount === 0) ci++;
        if (debtor.amount === 0) di++;
    }

    return result;
}
