import { EntityIdSchema } from "@domain/common";
import { PercentageBasePointSchema, ShareAmountSchema } from "@domain/money";
import z from "zod";

export const MoneyShareSchema = z.object({
    memberId: EntityIdSchema,
    value: ShareAmountSchema,
});

export type MoneyShare = z.infer<typeof MoneyShareSchema>;

export const PercentageShareSchema = z.object({
    memberId: EntityIdSchema,
    value: PercentageBasePointSchema,
});

export type PercentageShare = z.infer<typeof PercentageShareSchema>;
