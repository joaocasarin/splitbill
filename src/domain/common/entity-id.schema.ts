import z from "zod";

export const EntityIdSchema = z.int().positive().max(Number.MAX_SAFE_INTEGER);

export type EntityId = z.infer<typeof EntityIdSchema>;
