import type { DirectDebt } from "@domain/balance";

export const directDebts: DirectDebt[] = [
    { fromMemberId: 1, toMemberId: 2, amount: 5000 },
    { fromMemberId: 3, toMemberId: 2, amount: 2000 },
];
