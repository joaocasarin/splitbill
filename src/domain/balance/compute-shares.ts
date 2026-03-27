import type { EntityId } from "../common";
import { BPS_TOTAL } from "../common";

export function computeEqualShares(
    memberIds: EntityId[],
    total: number,
    payerId: EntityId,
): Map<EntityId, number> {
    const shares = new Map<EntityId, number>();
    const participantCount = memberIds.length;
    const baseShare = Math.floor(total / participantCount);
    let remainderLeft = total - baseShare * participantCount;

    for (const memberId of memberIds) {
        shares.set(memberId, baseShare);
    }

    if (remainderLeft > 0 && memberIds.includes(payerId)) {
        shares.set(payerId, (shares.get(payerId) ?? 0) + 1);
        remainderLeft--;
    }

    for (const memberId of memberIds) {
        if (remainderLeft === 0) break;
        if (memberId === payerId) continue;
        shares.set(memberId, (shares.get(memberId) ?? 0) + 1);
        remainderLeft--;
    }

    return shares;
}

export function computePercentageShares(
    shares: Array<{ memberId: EntityId; value: number }>,
    total: number,
    payerId: EntityId,
): Map<EntityId, number> {
    const result = new Map<EntityId, number>();
    const amounts = shares.map((s) =>
        Math.round((total * s.value) / BPS_TOTAL),
    );
    const computedSum = amounts.reduce((a, b) => a + b, 0);
    const remainder = total - computedSum;

    for (let i = 0; i < shares.length; i++) {
        result.set(shares[i].memberId, amounts[i]);
    }

    if (remainder !== 0) {
        const step = remainder > 0 ? 1 : -1;
        let left = Math.abs(remainder);

        if (shares.some((s) => s.memberId === payerId)) {
            result.set(payerId, (result.get(payerId) ?? 0) + step);
            left--;
        }

        for (const share of shares) {
            if (left === 0) break;
            if (share.memberId === payerId) continue;
            result.set(
                share.memberId,
                (result.get(share.memberId) ?? 0) + step,
            );
            left--;
        }
    }

    return result;
}
