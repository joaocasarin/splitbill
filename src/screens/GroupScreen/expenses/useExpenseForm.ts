import type { EntityId } from "@domain/common";
import type { Expense } from "@domain/expense";
import {
    buildEqualExpense,
    buildFixedExpense,
    buildPercentageExpense,
} from "@domain/expense";
import type { User } from "@domain/user";
import { useAppStore } from "@store";
import { useState } from "react";
import { computeCanSubmit } from "./computeCanSubmit";
import { getInitialExpenseState } from "./getInitialExpenseState";

export function useExpenseForm(
    groupId: EntityId,
    onClose: () => void,
    expense?: Expense,
) {
    const { global, addExpense, updateExpense } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const members: User[] = group
        ? group.memberIds.map((id) => ({
              id,
              name: users.find((u) => u.id === id)?.name ?? `User ${id}`,
          }))
        : [];

    const firstMemberId = members[0]?.id ?? null;
    const isEditing = expense !== undefined;
    const initial = getInitialExpenseState(members, firstMemberId, expense);

    const [title, setTitle] = useState(initial.title);
    const [total, setTotal] = useState(initial.total);
    const [payerId, setPayerId] = useState(initial.payerId);
    const [splitMode, setSplitMode] = useState(initial.splitMode);
    const [participantIds, setParticipantIds] = useState(
        initial.participantIds,
    );
    const [fixedShares, setFixedShares] = useState(initial.fixedShares);
    const [percentageShares, setPercentageShares] = useState(
        initial.percentageShares,
    );

    const canSubmit = computeCanSubmit(
        title,
        total,
        payerId,
        splitMode,
        participantIds,
        fixedShares,
        percentageShares,
    );

    function toggleParticipant(id: EntityId) {
        setParticipantIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handlePayerChange(id: EntityId) {
        setPayerId(id);
        setParticipantIds((prev) => new Set([...prev, id]));
    }

    function handleFixedShareChange(memberId: EntityId, value: number) {
        setFixedShares((prev) => new Map(prev).set(memberId, value));
    }

    function handlePercentageShareChange(
        memberId: EntityId,
        percentage: number,
    ) {
        setPercentageShares((prev) =>
            new Map(prev).set(memberId, Math.round(percentage * 100)),
        );
    }

    function handleSubmit() {
        const built =
            splitMode === "equal"
                ? buildEqualExpense(title, total, payerId, participantIds)
                : splitMode === "fixed"
                  ? buildFixedExpense(title, total, payerId, fixedShares)
                  : buildPercentageExpense(
                        title,
                        total,
                        payerId,
                        percentageShares,
                    );

        if (built === null) return;

        if (expense) {
            updateExpense(groupId, { ...built, id: expense.id });
        } else {
            addExpense(groupId, built);
        }
        reset();
        onClose();
    }

    function reset() {
        const defaults = getInitialExpenseState(members, firstMemberId);
        setTitle(defaults.title);
        setTotal(defaults.total);
        setPayerId(defaults.payerId);
        setSplitMode(defaults.splitMode);
        setParticipantIds(defaults.participantIds);
        setFixedShares(defaults.fixedShares);
        setPercentageShares(defaults.percentageShares);
    }

    function handleOpenChange(next: boolean) {
        if (!next) {
            reset();
            onClose();
        }
    }

    return {
        members,
        isEditing,
        title,
        setTitle,
        total,
        setTotal,
        payerId,
        splitMode,
        setSplitMode,
        participantIds,
        fixedShares,
        percentageShares,
        canSubmit,
        toggleParticipant,
        handlePayerChange,
        handleFixedShareChange,
        handlePercentageShareChange,
        handleSubmit,
        handleOpenChange,
    };
}
