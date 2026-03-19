import { CurrencyInput } from "@components/CurrencyInput";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import type { EntityId } from "@domain/common";
import type { CreateSettlement, Settlement } from "@domain/settlement";
import { useId } from "react";
import type { MemberRow } from "../members/MembersSection";
import { useSettlementForm } from "./useSettlementForm";

type Props = {
    open: boolean;
    members: MemberRow[];
    onSubmit: (settlement: CreateSettlement) => void;
    onClose: () => void;
    settlement?: Settlement;
    onDelete?: (settlementId: EntityId) => void;
};

export function SettlementModal({
    open,
    members,
    onSubmit,
    onClose,
    settlement,
    onDelete,
}: Props) {
    const {
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
    } = useSettlementForm({
        members,
        onSubmit,
        onClose,
        settlement,
    });

    const baseId = useId();

    function handleDelete() {
        if (settlement && onDelete) {
            onDelete(settlement.id);
            onClose();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit settlement" : "Add settlement"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={`${baseId}-from`}>From</label>
                        <select
                            id={`${baseId}-from`}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={fromMemberId ?? ""}
                            onChange={(e) =>
                                handleFromChange(Number(e.target.value))
                            }
                        >
                            <option value="" disabled>
                                Select member
                            </option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={`${baseId}-to`}>To</label>
                        <select
                            id={`${baseId}-to`}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={toMemberId ?? ""}
                            onChange={(e) =>
                                handleToChange(Number(e.target.value))
                            }
                            disabled={fromMemberId === null}
                        >
                            <option value="" disabled>
                                Select member
                            </option>
                            {membersExceptFrom.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <CurrencyInput
                        label="Amount"
                        value={amount}
                        onChange={setAmount}
                    />
                </div>

                <DialogFooter>
                    {isEditing && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {isEditing ? "Save" : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
