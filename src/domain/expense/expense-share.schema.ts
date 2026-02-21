import z from "zod";
import { EntityIdSchema } from "../common/entity-id.schema";
import { ShareAmountSchema } from "../money/money.schema";
import { PercentageBasePointSchema } from "../money/percentage.schema";

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
