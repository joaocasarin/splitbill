import { EntityIdSchema } from "@domain/common";
import { ShareAmountSchema } from "@domain/money";
import { z } from "zod";

export const SettlementSchema = z
    .object({
        id: EntityIdSchema,
        fromMemberId: EntityIdSchema,
        toMemberId: EntityIdSchema,
        amount: ShareAmountSchema,
    })
    .refine((s) => s.fromMemberId !== s.toMemberId, {
        error: "A member cannot settle a debt with themselves",
        path: ["toMemberId"],
    });

export type Settlement = z.infer<typeof SettlementSchema>;
