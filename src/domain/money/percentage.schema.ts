import z from "zod";

export const PercentageBasePointSchema = z
    .int({ error: "Percentage must be an integer" })
    .min(1, { error: "Percentage must be greater than zero" })
    .max(10000, { error: "Percentage cannot exceed 100%" });

export type PercentageBasePoint = z.infer<typeof PercentageBasePointSchema>;
