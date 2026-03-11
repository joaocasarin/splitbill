import { CurrencyInput } from "@components/CurrencyInput";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import type { DirectDebt } from "@domain/balance";
import type { Settlement } from "@domain/settlement";
import type { User } from "@domain/user";
import { useId } from "react";
import { useSettlementForm } from "./useSettlementForm";

type Props = {
    open: boolean;
    members: User[];
    directDebts: DirectDebt[];
    onSubmit: (settlement: Omit<Settlement, "id">) => void;
    onClose: () => void;
};

export function AddSettlementModal({
    open,
    members,
    directDebts,
    onSubmit,
    onClose,
}: Props) {
    const {
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
    } = useSettlementForm({ members, directDebts, onSubmit, onClose });

    const baseId = useId();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add settlement</DialogTitle>
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
                                Select debtor
                            </option>
                            {debtorsWithDebts.map((m) => (
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
                                Select creditor
                            </option>
                            {creditorsForDebtor.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <CurrencyInput
                        label="Amount"
                        value={amount}
                        onChange={setAmount}
                    />

                    {maxAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Max: R${" "}
                            {(maxAmount / 100).toFixed(2).replace(".", ",")}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        disabled={!canCreate}
                        onClick={handleCreate}
                    >
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
