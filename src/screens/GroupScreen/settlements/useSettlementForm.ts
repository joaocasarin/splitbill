import type { EntityId } from "@domain/common";
import type { CreateSettlement, Settlement } from "@domain/settlement";
import { useState } from "react";
import type { MemberRow } from "../members/MembersSection";

type UseSettlementFormParams = {
    members: MemberRow[];
    onSubmit: (settlement: CreateSettlement) => void;
    onClose: () => void;
    settlement?: Settlement;
};

export function useSettlementForm({
    members,
    onSubmit,
    onClose,
    settlement,
}: UseSettlementFormParams) {
    const isEditing = settlement !== undefined;

    const [fromMemberId, setFromMemberId] = useState<EntityId | null>(
        settlement?.fromMemberId ?? null,
    );
    const [toMemberId, setToMemberId] = useState<EntityId | null>(
        settlement?.toMemberId ?? null,
    );
    const [amount, setAmount] = useState(settlement?.amount ?? 0);

    const membersExceptFrom =
        fromMemberId !== null
            ? members.filter((m) => m.id !== fromMemberId)
            : members;

    const canSubmit =
        fromMemberId !== null && toMemberId !== null && amount > 0;

    function handleFromChange(id: EntityId) {
        setFromMemberId(id);
        setToMemberId(null);
        setAmount(0);
    }

    function handleToChange(id: EntityId) {
        setToMemberId(id);
        setAmount(0);
    }

    function reset() {
        setFromMemberId(null);
        setToMemberId(null);
        setAmount(0);
    }

    function handleSubmit() {
        if (!canSubmit || fromMemberId === null || toMemberId === null) return;
        onSubmit({ fromMemberId, toMemberId, amount });
        reset();
        onClose();
    }

    function handleOpenChange(next: boolean) {
        if (!next) {
            reset();
            onClose();
        }
    }

    return {
        isEditing,
        fromMemberId,
        toMemberId,
        amount,
        setAmount,
        membersExceptFrom,
        canSubmit,
        handleFromChange,
        handleToChange,
        handleSubmit,
        handleOpenChange,
    };
}
