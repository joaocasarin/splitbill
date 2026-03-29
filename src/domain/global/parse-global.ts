import { type Global, GlobalSchema } from "./global.schema";

export type ParseGlobalResult =
    | { success: true; data: Global }
    | { success: false; error: string };

export function parseGlobal(raw: unknown): ParseGlobalResult {
    const result = GlobalSchema.safeParse(raw);

    if (!result.success) {
        return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
}
