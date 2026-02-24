import type { EntityId } from "@domain/common";
import type { Global } from "@domain/global";

type EntityType = "user" | "group" | "expense" | "settlement";

export function createIdGenerator(global: Global) {
    let maxUserId = 0;
    let maxGroupId = 0;
    let maxExpenseId = 0;
    let maxSettlementId = 0;

    for (const user of global.users) {
        if (user.id > maxUserId) maxUserId = user.id;
    }

    for (const group of global.groups) {
        if (group.id > maxGroupId) maxGroupId = group.id;

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
    };

    return function createId(type: EntityType): EntityId {
        counters[type] += 1;
        return counters[type];
    };
}
