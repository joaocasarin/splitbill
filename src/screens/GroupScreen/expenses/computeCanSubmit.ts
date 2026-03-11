import {
    BPS_TOTAL,
    type EntityId,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "@domain/common";
import type { SplitMode } from "@domain/expense";

export function computeCanSubmit(
    title: string,
    total: number,
    payerId: EntityId | null,
    splitMode: SplitMode,
    participantIds: Set<EntityId>,
    fixedShares: Map<EntityId, number>,
    percentageShares: Map<EntityId, number>,
): boolean {
    const isTitleValid =
        title.trim().length >= EXPENSE_TITLE_MIN &&
        title.trim().length <= EXPENSE_TITLE_MAX;
    const isTotalValid = total > 0;

    if (!isTitleValid || !isTotalValid) return false;

    if (splitMode === "equal") {
        return (
            payerId !== null &&
            Array.from(participantIds).some((id) => id !== payerId)
        );
    }

    if (splitMode === "fixed") {
        const fixedSum = Array.from(fixedShares.values()).reduce(
            (a, b) => a + b,
            0,
        );
        const fixedHasNonPayerShare =
            payerId !== null &&
            Array.from(fixedShares.entries()).some(
                ([id, value]) => id !== payerId && value > 0,
            );
        return fixedSum === total && fixedHasNonPayerShare;
    }

    const percentageSum = Array.from(percentageShares.values()).reduce(
        (a, b) => a + b,
        0,
    );
    const percentageHasNonPayerShare =
        payerId !== null &&
        Array.from(percentageShares.entries()).some(
            ([id, value]) => id !== payerId && value > 0,
        );
    return percentageSum === BPS_TOTAL && percentageHasNonPayerShare;
}
