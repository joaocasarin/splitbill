import type { DirectDebt } from "@domain/balance";
import type { EntityId } from "@domain/common";
import type { Settlement } from "@domain/settlement";
import { validateSettlementCreation } from "@domain/settlement";
import type { User } from "@domain/user";
import { useState } from "react";

type UseSettlementFormParams = {
    members: User[];
    directDebts: DirectDebt[];
    onSubmit: (settlement: Omit<Settlement, "id">) => void;
    onClose: () => void;
};

export function useSettlementForm({
    members,
    directDebts,
    onSubmit,
    onClose,
}: UseSettlementFormParams) {
    const [fromMemberId, setFromMemberId] = useState<EntityId | null>(null);
    const [toMemberId, setToMemberId] = useState<EntityId | null>(null);
    const [amount, setAmount] = useState(0);

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

    const canCreate =
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

    function handleCreate() {
        if (!canCreate || fromMemberId === null || toMemberId === null) return;
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
        fromMemberId,
        toMemberId,
        amount,
        setAmount,
        debtorsWithDebts,
        creditorsForDebtor,
        maxAmount,
        canCreate,
        handleFromChange,
        handleToChange,
        handleCreate,
        handleOpenChange,
    };
}
