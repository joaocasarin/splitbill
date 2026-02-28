import type { Group } from "@domain/group";

/**
 * Grupo base para testes de domínio (compute-balances, compute-direct-debts).
 * Pode ser estendido com expenses e settlements conforme o teste.
 */
export const baseGroup: Group = {
    id: 1,
    name: "Test Group",
    memberIds: [1, 2, 3],
    expenses: [],
    settlements: [],
};
