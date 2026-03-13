import z from "zod";
import {
    BPS_TOTAL,
    EntityIdSchema,
    EQUAL_SPLIT_MEMBERS_MIN,
    EXPENSE_SHARES_MIN,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "../common";
import { ExpenseTotalSchema } from "../money";
import {
    MoneyShareSchema,
    PercentageShareSchema,
} from "./expense-share.schema";

export const SplitModeSchema = z.enum(["equal", "fixed", "percentage"]);

const BaseExpenseFields = {
    id: EntityIdSchema,
    title: z
        .string()
        .min(EXPENSE_TITLE_MIN, {
            error: `Title must be at least ${EXPENSE_TITLE_MIN} characters`,
        })
        .max(EXPENSE_TITLE_MAX, {
            error: `Title cannot exceed ${EXPENSE_TITLE_MAX} characters`,
        }),
    total: ExpenseTotalSchema,
    payerId: EntityIdSchema,
    createdAt: z.number().int().positive(),
    updatedAt: z.number().int().positive().optional(),
};

export const EqualExpenseSchema = z.object({
    ...BaseExpenseFields,
    splitMode: z.literal(SplitModeSchema.enum.equal),
    memberIds: z
        .array(EntityIdSchema)
        .min(EQUAL_SPLIT_MEMBERS_MIN)
        .refine((ids) => new Set(ids).size === ids.length, {
            error: "memberIds cannot contain duplicates",
            path: ["memberIds"],
        }),
});

export const FixedExpenseSchema = z
    .object({
        ...BaseExpenseFields,
        splitMode: z.literal(SplitModeSchema.enum.fixed),
        shares: z
            .array(MoneyShareSchema)
            .min(EXPENSE_SHARES_MIN)
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
    splitMode: z.literal(SplitModeSchema.enum.percentage),
    shares: z
        .array(PercentageShareSchema)
        .min(EXPENSE_SHARES_MIN)
        .refine(
            (shares) =>
                new Set(shares.map((s) => s.memberId)).size === shares.length,
            { error: "Duplicate memberIds in shares", path: ["shares"] },
        )
        .refine(
            (shares) =>
                shares.reduce((acc, s) => acc + s.value, 0) === BPS_TOTAL,
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
export type SplitMode = z.infer<typeof SplitModeSchema>;
