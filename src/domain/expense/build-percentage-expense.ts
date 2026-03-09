import type { EntityId } from "@domain/common";
import type { PercentageExpense } from "./expense.schema";

export function buildPercentageExpense(
    title: string,
    total: number,
    payerId: EntityId | null,
    shares: Map<EntityId, number>,
): Omit<PercentageExpense, "id"> | null {
    if (payerId === null) return null;

    return {
        title: title.trim(),
        total,
        payerId,
        splitMode: "percentage",
        shares: Array.from(shares, ([memberId, value]) => ({
            memberId,
            value,
        })),
    };
}
