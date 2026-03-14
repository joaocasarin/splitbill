import type { CreateEqualExpense } from "@domain/expense";

export const defaultEqualExpense: CreateEqualExpense = {
    title: "Hotel",
    total: 10000,
    payerId: 1,
    splitMode: "equal",
    memberIds: [1, 2],
};
