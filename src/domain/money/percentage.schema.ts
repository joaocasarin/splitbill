import { BPS_MIN, BPS_TOTAL } from "@domain/common";
import z from "zod";

export const PercentageBasePointSchema = z
    .int({ error: "Percentage must be an integer" })
    .min(BPS_MIN, { error: "Percentage must be greater than zero" })
    .max(BPS_TOTAL, { error: "Percentage cannot exceed 100%" });

export type PercentageBasePoint = z.infer<typeof PercentageBasePointSchema>;
