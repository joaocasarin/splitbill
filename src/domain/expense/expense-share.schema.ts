import z from "zod";
import { EntityIdSchema } from "../common";
import { PercentageBasePointSchema, ShareAmountSchema } from "../money";

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
