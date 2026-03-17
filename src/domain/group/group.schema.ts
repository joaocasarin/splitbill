import z from "zod";
import {
    EntityIdSchema,
    GROUP_MEMBERS_MIN,
    GROUP_NAME_MAX,
    GROUP_NAME_MIN,
} from "../common";
import { ExpenseSchema } from "../expense";
import { MemberSchema } from "../member";
import { SettlementSchema } from "../settlement";

export const GroupSchema = z
    .object({
        id: EntityIdSchema,
        name: z
            .string()
            .min(GROUP_NAME_MIN, {
                error: `Group name must be at least ${GROUP_NAME_MIN} characters`,
            })
            .max(GROUP_NAME_MAX, {
                error: `Group name cannot exceed ${GROUP_NAME_MAX} characters`,
            }),
        createdAt: z.number().int().positive(),
        members: z.array(MemberSchema).min(GROUP_MEMBERS_MIN),
        expenses: z.array(ExpenseSchema),
        settlements: z.array(SettlementSchema),
    })
    .superRefine((data, ctx) => {
        const memberIds = data.members.map((m) => m.id);
        if (new Set(memberIds).size !== memberIds.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate member IDs in group",
                path: ["members"],
            });
        }

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

        const memberIdSet = new Set(memberIds);
        data.expenses.forEach((expense, ei) => {
            if (!memberIdSet.has(expense.payerId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Expense[${ei}]: payerId ${expense.payerId} is not a member of the group`,
                    path: ["expenses", ei, "payerId"],
                });
            }

            if (expense.splitMode === "equal") {
                expense.memberIds.forEach((id, mi) => {
                    if (!memberIdSet.has(id)) {
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
                    if (!memberIdSet.has(share.memberId)) {
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
            if (!memberIdSet.has(settlement.fromMemberId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Settlement[${si}]: fromMemberId ${settlement.fromMemberId} is not a member of the group`,
                    path: ["settlements", si, "fromMemberId"],
                });
            }
            if (!memberIdSet.has(settlement.toMemberId)) {
                ctx.addIssue({
                    code: "custom",
                    message: `Settlement[${si}]: toMemberId ${settlement.toMemberId} is not a member of the group`,
                    path: ["settlements", si, "toMemberId"],
                });
            }
        });
    });

export type Group = z.infer<typeof GroupSchema>;
