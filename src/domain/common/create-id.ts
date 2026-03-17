import type { Global } from "../global";
import type { EntityId } from "./entity-id.schema";

type EntityType = "user" | "group" | "expense" | "settlement" | "member";

export function createIdGenerator(global: Global) {
    let maxUserId = 0;
    let maxGroupId = 0;
    let maxExpenseId = 0;
    let maxSettlementId = 0;
    let maxMemberId = 0;

    for (const user of global.users) {
        if (user.id > maxUserId) maxUserId = user.id;
    }

    for (const group of global.groups) {
        if (group.id > maxGroupId) maxGroupId = group.id;

        for (const member of group.members ?? []) {
            if (member.id > maxMemberId) maxMemberId = member.id;
        }

        for (const expense of group.expenses) {
            if (expense.id > maxExpenseId) maxExpenseId = expense.id;
        }

        for (const settlement of group.settlements) {
            if (settlement.id > maxSettlementId)
                maxSettlementId = settlement.id;
        }
    }

    const counters: Record<EntityType, number> = {
        user: maxUserId,
        group: maxGroupId,
        expense: maxExpenseId,
        settlement: maxSettlementId,
        member: maxMemberId,
    };

    return function createId(type: EntityType): EntityId {
        counters[type] += 1;
        return counters[type];
    };
}
