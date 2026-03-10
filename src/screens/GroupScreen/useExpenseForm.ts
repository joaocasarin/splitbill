import {
    BPS_TOTAL,
    type EntityId,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "@domain/common";
import {
    buildEqualExpense,
    buildFixedExpense,
    buildPercentageExpense,
    type SplitMode,
} from "@domain/expense";
import { useAppStore } from "@store";
import { useState } from "react";

export function useExpenseForm(groupId: EntityId, onClose: () => void) {
    const { global, addExpense } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const users = global.users;
    const members = group
        ? group.memberIds.map((id) => ({
              id,
              name: users.find((u) => u.id === id)?.name ?? `User ${id}`,
          }))
        : [];

    const firstMemberId = members[0]?.id ?? null;

    const [title, setTitle] = useState("");
    const [total, setTotal] = useState(0);
    const [payerId, setPayerId] = useState<EntityId | null>(firstMemberId);
    const [splitMode, setSplitMode] = useState<SplitMode>("equal");
    const [participantIds, setParticipantIds] = useState<Set<EntityId>>(
        new Set(firstMemberId !== null ? [firstMemberId] : []),
    );
    const [fixedShares, setFixedShares] = useState<Map<EntityId, number>>(
        () => new Map(members.map((m) => [m.id, 0])),
    );
    const [percentageShares, setPercentageShares] = useState<
        Map<EntityId, number>
    >(() => new Map(members.map((m) => [m.id, 0])));

    const isTitleValid =
        title.trim().length >= EXPENSE_TITLE_MIN &&
        title.trim().length <= EXPENSE_TITLE_MAX;
    const isTotalValid = total > 0;

    const hasNonPayerParticipant =
        payerId !== null &&
        Array.from(participantIds).some((id) => id !== payerId);

    const fixedSum = Array.from(fixedShares.values()).reduce(
        (a, b) => a + b,
        0,
    );
    const fixedHasNonPayerShare =
        payerId !== null &&
        Array.from(fixedShares.entries()).some(
            ([id, value]) => id !== payerId && value > 0,
        );
    const isFixedValid = fixedSum === total && fixedHasNonPayerShare;

    const percentageSum = Array.from(percentageShares.values()).reduce(
        (a, b) => a + b,
        0,
    );
    const percentageHasNonPayerShare =
        payerId !== null &&
        Array.from(percentageShares.entries()).some(
            ([id, value]) => id !== payerId && value > 0,
        );
    const isPercentageValid =
        percentageSum === BPS_TOTAL && percentageHasNonPayerShare;

    const canCreate =
        isTitleValid &&
        isTotalValid &&
        (splitMode === "equal"
            ? hasNonPayerParticipant
            : splitMode === "fixed"
              ? isFixedValid
              : isPercentageValid);

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

    function handleCreate() {
        const expense =
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

        if (expense === null) return;
        addExpense(groupId, expense);
        reset();
        onClose();
    }

    function reset() {
        setTitle("");
        setTotal(0);
        setPayerId(firstMemberId);
        setSplitMode("equal");
        setParticipantIds(
            new Set(firstMemberId !== null ? [firstMemberId] : []),
        );
        setFixedShares(new Map(members.map((m) => [m.id, 0])));
        setPercentageShares(new Map(members.map((m) => [m.id, 0])));
    }

    function handleOpenChange(next: boolean) {
        if (!next) {
            reset();
            onClose();
        }
    }

    return {
        members,
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
        canCreate,
        toggleParticipant,
        handlePayerChange,
        handleFixedShareChange,
        handlePercentageShareChange,
        handleCreate,
        handleOpenChange,
    };
}
