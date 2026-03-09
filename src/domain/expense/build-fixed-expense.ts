import type { EntityId } from "@domain/common";
import type { FixedExpense } from "./expense.schema";

export function buildFixedExpense(
    title: string,
    total: number,
    payerId: EntityId | null,
    shares: Map<EntityId, number>,
): Omit<FixedExpense, "id"> | null {
    if (payerId === null) return null;

    return {
        title: title.trim(),
        total,
        payerId,
        splitMode: "fixed",
        shares: Array.from(shares, ([memberId, value]) => ({
            memberId,
            value,
        })),
    };
}
