import z from "zod";
import { GroupSchema } from "../group";

export const GlobalSchema = z
    .object({
        version: z.int().positive(),
        groups: z.array(GroupSchema),
    })
    .superRefine((data, ctx) => {
        const groupIds = data.groups.map((g) => g.id);
        if (new Set(groupIds).size !== groupIds.length) {
            ctx.addIssue({
                code: "custom",
                message: "Duplicate group IDs in global state",
                path: ["groups"],
            });
        }
    });

export type Global = z.infer<typeof GlobalSchema>;
