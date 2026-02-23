import { EntityIdSchema, USER_NAME_MAX, USER_NAME_MIN } from "@domain/common";
import z from "zod";

export const UserSchema = z.object({
    id: EntityIdSchema,
    name: z
        .string()
        .min(USER_NAME_MIN, {
            error: `Name must be at least ${USER_NAME_MIN} characters`,
        })
        .max(USER_NAME_MAX, {
            error: `Name cannot exceed ${USER_NAME_MAX} characters`,
        }),
});

export type User = z.infer<typeof UserSchema>;
