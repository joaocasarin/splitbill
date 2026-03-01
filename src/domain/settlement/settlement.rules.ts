import type { DirectDebt } from "../balance";
import type { EntityId } from "../common";

export type ValidationResult =
    | { valid: true }
    | { valid: false; reason: string };

export function validateSettlementCreation(
    directDebts: DirectDebt[],
    fromMemberId: EntityId,
    toMemberId: EntityId,
    amount: number,
): ValidationResult {
    const debt = directDebts.find(
        (d) => d.fromMemberId === fromMemberId && d.toMemberId === toMemberId,
    );

    if (!debt) {
        return {
            valid: false,
            reason: "no direct debt from fromMember to toMember",
        };
    }

    if (amount > debt.amount) {
        return { valid: false, reason: "amount exceeds outstanding debt" };
    }

    return { valid: true };
}
