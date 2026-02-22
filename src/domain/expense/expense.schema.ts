import z from "zod";
import { EntityIdSchema } from "../common/entity-id.schema";
import { ExpenseTotalSchema } from "../money/money.schema";
import {
    MoneyShareSchema,
    PercentageShareSchema,
} from "./expense-share.schema";

const BaseExpenseFields = {
    id: EntityIdSchema,
    title: z
        .string()
        .min(3, { error: "Title must be at least 3 characters" })
        .max(50, { error: "Title cannot exceed 50 characters" }),
    total: ExpenseTotalSchema,
    payerId: EntityIdSchema,
};

export const EqualExpenseSchema = z.object({
    ...BaseExpenseFields,
    splitMode: z.literal("equal"),
    memberIds: z
        .array(EntityIdSchema)
        .min(2)
        .refine((ids) => new Set(ids).size === ids.length, {
            error: "memberIds cannot contain duplicates",
            path: ["memberIds"],
        }),
});

export const FixedExpenseSchema = z
    .object({
        ...BaseExpenseFields,
        splitMode: z.literal("fixed"),
        shares: z
            .array(MoneyShareSchema)
            .min(1)
            .refine(
                (shares) =>
                    new Set(shares.map((s) => s.memberId)).size ===
                    shares.length,
                { error: "Duplicate memberIds in shares", path: ["shares"] },
            ),
    })
    .superRefine((data, ctx) => {
        const sum = data.shares.reduce((acc, s) => acc + s.value, 0);
        if (sum !== data.total) {
            ctx.addIssue({
                code: "custom",
                message: "Sum of fixed shares must equal the expense total",
                path: ["shares"],
            });
        }
    });

export const PercentageExpenseSchema = z.object({
    ...BaseExpenseFields,
    splitMode: z.literal("percentage"),
    shares: z
        .array(PercentageShareSchema)
        .min(1)
        .refine(
            (shares) =>
                new Set(shares.map((s) => s.memberId)).size === shares.length,
            { error: "Duplicate memberIds in shares", path: ["shares"] },
        )
        .refine(
            (shares) => shares.reduce((acc, s) => acc + s.value, 0) === 10000,
            { error: "Percentages must sum to 100%", path: ["shares"] },
        ),
});

export const ExpenseSchema = z.discriminatedUnion("splitMode", [
    EqualExpenseSchema,
    FixedExpenseSchema,
    PercentageExpenseSchema,
]);

export type EqualExpense = z.infer<typeof EqualExpenseSchema>;
export type FixedExpense = z.infer<typeof FixedExpenseSchema>;
export type PercentageExpense = z.infer<typeof PercentageExpenseSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
