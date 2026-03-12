import { CurrencyInput } from "@components/CurrencyInput";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import type { EntityId } from "@domain/common";
import type { Expense } from "@domain/expense";
import { useId } from "react";
import { EqualSplitSection } from "./EqualSplitSection";
import { FixedSplitSection } from "./FixedSplitSection";
import { PercentageSplitSection } from "./PercentageSplitSection";
import { SplitModeToggle } from "./SplitModeToggle";
import { useExpenseForm } from "./useExpenseForm";

type Props = {
    groupId: EntityId;
    open: boolean;
    onClose: () => void;
    expense?: Expense;
    onDelete?: (expenseId: EntityId) => void;
};

export function ExpenseModal({
    groupId,
    onClose,
    open,
    expense,
    onDelete,
}: Props) {
    const {
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
    } = useExpenseForm(groupId, onClose, expense);

    const checkboxBaseId = useId();

    function handleDelete() {
        if (expense && onDelete) {
            onDelete(expense.id);
            onClose();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit expense" : "Add expense"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={`${checkboxBaseId}-title`}>Title</label>
                        <Input
                            id={`${checkboxBaseId}-title`}
                            placeholder="e.g. Hotel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <CurrencyInput
                        label="Total"
                        value={total}
                        onChange={setTotal}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={`${checkboxBaseId}-payer`}>
                            Paid by
                        </label>
                        <select
                            id={`${checkboxBaseId}-payer`}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={payerId ?? ""}
                            onChange={(e) =>
                                handlePayerChange(Number(e.target.value))
                            }
                        >
                            {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <SplitModeToggle
                        splitMode={splitMode}
                        onChange={setSplitMode}
                    />

                    {splitMode === "equal" && (
                        <EqualSplitSection
                            members={members}
                            participantIds={participantIds}
                            onToggle={toggleParticipant}
                        />
                    )}

                    {splitMode === "fixed" && (
                        <FixedSplitSection
                            members={members}
                            shares={fixedShares}
                            total={total}
                            onShareChange={handleFixedShareChange}
                        />
                    )}

                    {splitMode === "percentage" && (
                        <PercentageSplitSection
                            members={members}
                            shares={percentageShares}
                            onShareChange={handlePercentageShareChange}
                        />
                    )}
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
