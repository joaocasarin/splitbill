import type { EqualExpense } from "@domain/expense";

export const defaultEqualExpense: Omit<
    EqualExpense,
    "id" | "createdAt" | "updatedAt"
> = {
    title: "Hotel",
    total: 10000,
    payerId: 1,
    splitMode: "equal",
    memberIds: [1, 2],
};
