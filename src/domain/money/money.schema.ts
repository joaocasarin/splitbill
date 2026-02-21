import z from "zod";

const BaseCentSchema = z.int();

export const ExpenseTotalSchema = BaseCentSchema.positive({
    error: "Expense total must be greater than zero",
});
export const ShareAmountSchema = BaseCentSchema.positive({
    error: "Share amount must be greater than zero",
});
export const BalanceAmountSchema = BaseCentSchema;

export type ExpenseTotal = z.infer<typeof ExpenseTotalSchema>;
export type ShareAmount = z.infer<typeof ShareAmountSchema>;
export type BalanceAmount = z.infer<typeof BalanceAmountSchema>;
