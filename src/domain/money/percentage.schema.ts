import z from "zod";
import { BPS_MIN, BPS_TOTAL } from "../common";

export const PercentageBasePointSchema = z
    .int({ error: "Percentage must be an integer" })
    .min(BPS_MIN, { error: "Percentage must be greater than zero" })
    .max(BPS_TOTAL, { error: "Percentage cannot exceed 100%" });

export type PercentageBasePoint = z.infer<typeof PercentageBasePointSchema>;
