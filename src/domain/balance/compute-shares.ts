import type { EntityId } from "../common";

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
