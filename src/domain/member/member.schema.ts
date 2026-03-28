import z from "zod";
import { EntityIdSchema, USER_NAME_MAX, USER_NAME_MIN } from "../common";

export const MemberSchema = z.object({
    id: EntityIdSchema,
    name: z
        .string()
        .min(USER_NAME_MIN, {
            error: `Name must be at least ${USER_NAME_MIN} characters`,
        })
        .max(USER_NAME_MAX, {
            error: `Name cannot exceed ${USER_NAME_MAX} characters`,
        }),
    createdAt: z.number().int().positive(),
    deletedAt: z.number().int().positive().optional(),
});

export type Member = z.infer<typeof MemberSchema>;
