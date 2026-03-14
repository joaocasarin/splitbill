import type { DirectDebt } from "@domain/balance";
import type { EntityId } from "@domain/common";
import type { CreateSettlement, Settlement } from "@domain/settlement";
import { validateSettlementCreation } from "@domain/settlement";
import { useState } from "react";
import type { MemberRow } from "../members/MembersSection";

type UseSettlementFormParams = {
    members: MemberRow[];
    directDebts: DirectDebt[];
    onSubmit: (settlement: CreateSettlement) => void;
    onClose: () => void;
    settlement?: Settlement;
};

export function useSettlementForm({
    members,
    directDebts,
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

    const debtorsWithDebts = members.filter((m) =>
        directDebts.some((d) => d.fromMemberId === m.id),
    );

    const creditorsForDebtor = fromMemberId
        ? directDebts
              .filter((d) => d.fromMemberId === fromMemberId)
              .map((d) => {
                  const user = members.find((m) => m.id === d.toMemberId);
                  return {
                      id: d.toMemberId,
                      name: user?.name ?? `User ${d.toMemberId}`,
                      maxAmount: d.amount,
                  };
              })
        : [];

    const selectedDebt =
        fromMemberId !== null && toMemberId !== null
            ? (directDebts.find(
                  (d) =>
                      d.fromMemberId === fromMemberId &&
                      d.toMemberId === toMemberId,
              ) ?? null)
            : null;

    const maxAmount = selectedDebt?.amount ?? 0;

    const canSubmit =
        fromMemberId !== null &&
        toMemberId !== null &&
        amount > 0 &&
        validateSettlementCreation(
            directDebts,
            fromMemberId,
            toMemberId,
            amount,
        ).valid;

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
        debtorsWithDebts,
        creditorsForDebtor,
        maxAmount,
        canSubmit,
        handleFromChange,
        handleToChange,
        handleSubmit,
        handleOpenChange,
    };
}
