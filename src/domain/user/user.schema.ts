import z from "zod";
import { EntityIdSchema } from "../common/entity-id.schema";

export const UserSchema = z.object({
    id: EntityIdSchema,
    name: z
        .string()
        .min(3, { error: "Name must be at least 3 characters" })
        .max(25, { error: "Name cannot exceed 25 characters" }),
});

export type User = z.infer<typeof UserSchema>;
