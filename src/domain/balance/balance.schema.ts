import { EntityIdSchema } from "@domain/common";
import { BalanceAmountSchema, ShareAmountSchema } from "@domain/money";
import { z } from "zod";

export const MemberBalanceSchema = z.object({
    memberId: EntityIdSchema,
    amount: BalanceAmountSchema, // negative = liability, positive = receivable
});

export const SimplifiedDebtSchema = z
    .object({
        fromMemberId: EntityIdSchema,
        toMemberId: EntityIdSchema,
        amount: ShareAmountSchema,
    })
    .refine((e) => e.fromMemberId !== e.toMemberId, {
        error: "A debt edge cannot have the same member on both sides",
        path: ["toMemberId"],
    });

export type MemberBalance = z.infer<typeof MemberBalanceSchema>;
export type SimplifiedDebt = z.infer<typeof SimplifiedDebtSchema>;
