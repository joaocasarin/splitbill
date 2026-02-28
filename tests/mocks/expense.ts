import type { EqualExpense } from "@domain/expense";

/**
 * Despesa equal split mínima para testes (sem id; id é atribuído pela store).
 */
export const defaultEqualExpense: Omit<EqualExpense, "id"> = {
    title: "Hotel",
    total: 10000,
    payerId: 1,
    splitMode: "equal",
    memberIds: [1, 2],
};
