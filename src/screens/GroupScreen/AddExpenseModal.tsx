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
    type EntityId,
    EQUAL_SPLIT_MEMBERS_MIN,
    EXPENSE_TITLE_MAX,
    EXPENSE_TITLE_MIN,
} from "@domain/common";
import { buildEqualExpense } from "@domain/expense";
import { useAppStore } from "@store";
import { useId, useState } from "react";

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
    const [participantIds, setParticipantIds] = useState<Set<EntityId>>(
        new Set(firstMemberId !== null ? [firstMemberId] : []),
    );

    const checkboxBaseId = useId();

    const isTitleValid =
        title.trim().length >= EXPENSE_TITLE_MIN &&
        title.trim().length <= EXPENSE_TITLE_MAX;
    const isTotalValid = total > 0;
    const hasEnoughParticipants =
        participantIds.size >= EQUAL_SPLIT_MEMBERS_MIN;
    const canCreate = isTitleValid && isTotalValid && hasEnoughParticipants;

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

    function handleCreate() {
        const expense = buildEqualExpense(
            title,
            total,
            payerId,
            participantIds,
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
        setParticipantIds(
            new Set(firstMemberId !== null ? [firstMemberId] : []),
        );
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

                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium">
                            Participants
                        </span>

                        <ul className="flex flex-col gap-1">
                            {members.map((m) => (
                                <li key={m.id}>
                                    <label
                                        htmlFor={`${checkboxBaseId}-participant-${m.id}`}
                                        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <input
                                            id={`${checkboxBaseId}-participant-${m.id}`}
                                            type="checkbox"
                                            checked={participantIds.has(m.id)}
                                            onChange={() =>
                                                toggleParticipant(m.id)
                                            }
                                            className="cursor-pointer rounded border-border accent-primary"
                                        />

                                        {m.name}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
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
