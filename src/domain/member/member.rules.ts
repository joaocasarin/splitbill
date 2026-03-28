import type { MemberBalance } from "../balance";
import type { EntityId } from "../common";
import { GROUP_MEMBERS_MIN } from "../common";
import type { ValidationResult } from "../settlement";

export function validateMemberDeletion(
    memberId: EntityId,
    balances: MemberBalance[],
    activeCount: number,
): ValidationResult {
    const balance = balances.find((b) => b.memberId === memberId);

    if (balance && balance.amount !== 0) {
        return { valid: false, reason: "Member has a non-zero balance" };
    }

    if (activeCount - 1 < GROUP_MEMBERS_MIN) {
        return {
            valid: false,
            reason: `Group must retain at least ${GROUP_MEMBERS_MIN} active members`,
        };
    }

    return { valid: true };
}
