import { z } from "zod";
import { EntityIdSchema } from "../common/entity-id.schema";
import { ShareAmountSchema } from "../money/money.schema";

export const SettlementSchema = z
    .object({
        id: EntityIdSchema,
        fromMemberId: EntityIdSchema,
        toMemberId: EntityIdSchema,
        amount: ShareAmountSchema,
        createdAt: z.iso.datetime(),
    })
    .refine((s) => s.fromMemberId !== s.toMemberId, {
        error: "A member cannot settle a debt with themselves",
        path: ["toMemberId"],
    });

export type Settlement = z.infer<typeof SettlementSchema>;
