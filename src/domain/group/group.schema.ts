import { EntityIdSchema } from "@domain/common";
import { ExpenseSchema } from "@domain/expense";
import { SettlementSchema } from "@domain/settlement";
import z from "zod";

export const GroupSchema = z
    .object({
        id: EntityIdSchema,
        name: z
            .string()
            .min(4, { error: "Group name must be at least 4 characters" })
            .max(20, { error: "Group name cannot exceed 20 characters" }),
        memberIds: z
            .array(EntityIdSchema)
            .min(2)
            .refine((ids) => new Set(ids).size === ids.length, {
                error: "Duplicate member IDs in group",
                path: ["memberIds"],
            }),
        expenses: z.array(ExpenseSchema),
        settlements: z.array(SettlementSchema),
    })
    .superRefine((data, ctx) => {
        const expenseIds = data.expenses.map((e) => e.id);
        if (new Set(expenseIds).size !== expenseIds.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate expense IDs in group",
                path: ["expenses"],
            });
        }

        const settlementIds = data.settlements.map((s) => s.id);
        if (new Set(settlementIds).size !== settlementIds.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate settlement IDs in group",
                path: ["settlements"],
            });
        }

        const memberIds = new Set(data.memberIds);
        data.expenses.forEach((expense, ei) => {
            if (!memberIds.has(expense.payerId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Expense[${ei}]: payerId ${expense.payerId} is not a member of the group`,
                    path: ["expenses", ei, "payerId"],
                });
            }

            if (expense.splitMode === "equal") {
                expense.memberIds.forEach((id, mi) => {
                    if (!memberIds.has(id)) {
                        ctx.addIssue({
                            code: "custom",
                            message: `Expense[${ei}]: memberIds[${mi}] ${id} is not a member of the group`,
                            path: ["expenses", ei, "memberIds", mi],
                        });
                    }
                });
            }

            if (
                expense.splitMode === "fixed" ||
                expense.splitMode === "percentage"
            ) {
                expense.shares.forEach((share, si) => {
                    if (!memberIds.has(share.memberId)) {
                        ctx.addIssue({
                            code: "custom",
                            message: `Expense[${ei}]: shares[${si}].memberId ${share.memberId} is not a member of the group`,
                            path: ["expenses", ei, "shares", si, "memberId"],
                        });
                    }
                });
            }
        });

        data.settlements.forEach((settlement, si) => {
            if (!memberIds.has(settlement.fromMemberId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Settlement[${si}]: fromMemberId ${settlement.fromMemberId} is not a member of the group`,
                    path: ["settlements", si, "fromMemberId"],
                });
            }
            if (!memberIds.has(settlement.toMemberId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Settlement[${si}]: toMemberId ${settlement.toMemberId} is not a member of the group`,
                    path: ["settlements", si, "toMemberId"],
                });
            }
        });
    });

export type Group = z.infer<typeof GroupSchema>;
