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
import { useId, useState } from "react";
import { EqualSplitSection } from "./EqualSplitSection";
import { SplitModeToggle } from "./SplitModeToggle";

type Props = {
    groupId: EntityId;
    open: boolean;
    onClose: () => void;
};

export function AddExpenseModal({ groupId, onClose, open }: Props) {
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

    const checkboxBaseId = useId();

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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add expense</DialogTitle>
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
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Shares
                                </span>
                                <span
                                    className={`text-xs ${
                                        fixedSum === total
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {fixedSum === total
                                        ? "✓ matches total"
                                        : `${(fixedSum / 100).toFixed(2).replace(".", ",")} / ${(total / 100).toFixed(2).replace(".", ",")}`}
                                </span>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {members.map((m) => (
                                    <li key={m.id}>
                                        <CurrencyInput
                                            label={m.name}
                                            value={fixedShares.get(m.id) ?? 0}
                                            onChange={(value) =>
                                                handleFixedShareChange(
                                                    m.id,
                                                    value,
                                                )
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {splitMode === "percentage" && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Shares
                                </span>
                                <span
                                    className={`text-xs ${
                                        percentageSum === BPS_TOTAL
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {percentageSum === BPS_TOTAL
                                        ? "✓ 100%"
                                        : `${(percentageSum / 100).toFixed(0)}%`}
                                </span>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {members.map((m) => (
                                    <li
                                        key={m.id}
                                        className="flex items-center gap-2"
                                    >
                                        <label
                                            htmlFor={`${checkboxBaseId}-pct-${m.id}`}
                                            className="text-sm w-24 truncate"
                                        >
                                            {m.name}
                                        </label>
                                        <div className="flex items-center gap-1 flex-1">
                                            <Input
                                                id={`${checkboxBaseId}-pct-${m.id}`}
                                                type="number"
                                                min={0}
                                                max={100}
                                                step="any"
                                                value={
                                                    (percentageShares.get(
                                                        m.id,
                                                    ) ?? 0) / 100
                                                }
                                                onChange={(e) =>
                                                    handlePercentageShareChange(
                                                        m.id,
                                                        Number(e.target.value),
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-muted-foreground shrink-0">
                                                %
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
