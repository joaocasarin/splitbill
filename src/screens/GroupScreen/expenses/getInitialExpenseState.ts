import type { EntityId } from "@domain/common";
import type { Expense, SplitMode } from "@domain/expense";
import type { User } from "@domain/user";

export type ExpenseFormState = {
    title: string;
    total: number;
    payerId: EntityId | null;
    splitMode: SplitMode;
    participantIds: Set<EntityId>;
    fixedShares: Map<EntityId, number>;
    percentageShares: Map<EntityId, number>;
};

export function getInitialExpenseState(
    members: User[],
    firstMemberId: EntityId | null,
    expense?: Expense,
): ExpenseFormState {
    if (expense) {
        return {
            title: expense.title,
            total: expense.total,
            payerId: expense.payerId,
            splitMode: expense.splitMode,
            participantIds:
                expense.splitMode === "equal"
                    ? new Set(expense.memberIds)
                    : new Set(firstMemberId !== null ? [firstMemberId] : []),
            fixedShares:
                expense.splitMode === "fixed"
                    ? new Map(expense.shares.map((s) => [s.memberId, s.value]))
                    : new Map(members.map((m) => [m.id, 0])),
            percentageShares:
                expense.splitMode === "percentage"
                    ? new Map(expense.shares.map((s) => [s.memberId, s.value]))
                    : new Map(members.map((m) => [m.id, 0])),
        };
    }

    return {
        title: "",
        total: 0,
        payerId: firstMemberId,
        splitMode: "equal",
        participantIds: new Set(firstMemberId !== null ? [firstMemberId] : []),
        fixedShares: new Map(members.map((m) => [m.id, 0])),
        percentageShares: new Map(members.map((m) => [m.id, 0])),
    };
}
