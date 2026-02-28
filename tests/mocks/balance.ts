import type { DirectDebt } from "@domain/balance";

/**
 * Lista de dívidas diretas para testes de regras de settlement.
 */
export const directDebts: DirectDebt[] = [
    { fromMemberId: 1, toMemberId: 2, amount: 5000 },
    { fromMemberId: 3, toMemberId: 2, amount: 2000 },
];
