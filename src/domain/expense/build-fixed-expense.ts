import type { EntityId } from "@domain/common";
import type { CreateFixedExpense } from "./expense.schema";

export function buildFixedExpense(
    title: string,
    total: number,
    payerId: EntityId | null,
    shares: Map<EntityId, number>,
): CreateFixedExpense | null {
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
