import { z } from "zod";
import { EntityIdSchema } from "../common";
import { ShareAmountSchema } from "../money";

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
