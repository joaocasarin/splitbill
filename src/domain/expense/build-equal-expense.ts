import type { EntityId } from "@domain/common";
import type { EqualExpense } from "./expense.schema";

export function buildEqualExpense(
    title: string,
    total: number,
    payerId: EntityId | null,
    participantIds: Set<EntityId>,
): Omit<EqualExpense, "id"> | null {
    if (payerId === null) return null;

    return {
        title: title.trim(),
        total,
        payerId,
        splitMode: "equal",
        memberIds: Array.from(participantIds),
    };
}
