import type { DirectDebt } from "../balance";
import type { EntityId } from "../common";
import type { Settlement } from "./settlement.schema";

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

export function validateSettlementsStillValid(
    directDebts: DirectDebt[],
    settlements: Settlement[],
): ValidationResult {
    for (const settlement of settlements) {
        const result = validateSettlementCreation(
            directDebts,
            settlement.fromMemberId,
            settlement.toMemberId,
            settlement.amount,
        );
        if (!result.valid) {
            return {
                valid: false,
                reason: "existing settlements would become invalid",
            };
        }
    }
    return { valid: true };
}
