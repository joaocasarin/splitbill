import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import type { EntityId } from "@domain/common";
import { useAppStore } from "@store";
import { useId, useState } from "react";

type Props = {
    groupId: EntityId;
    open: boolean;
    onClose: () => void;
};

export function AddMemberModal({ groupId, open, onClose }: Props) {
    const { global, addMemberToGroup } = useAppStore();
    const group = global.groups.find((g) => g.id === groupId);
    const nonMembers = global.users.filter(
        (u) => !group?.memberIds.includes(u.id),
    );

    const [selectedId, setSelectedId] = useState<EntityId | null>(null);
    const selectId = useId();

    function handleAdd() {
        if (selectedId === null) return;
        addMemberToGroup(groupId, selectedId);
        reset();
        onClose();
    }

    function reset() {
        setSelectedId(null);
    }

    // c8 ignore next 3
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
                    <DialogTitle>Add member</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-1.5 py-2">
                    <label htmlFor={selectId} className="text-sm font-medium">
                        Select user
                    </label>
                    <select
                        id={selectId}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={selectedId ?? ""}
                        onChange={(e) =>
                            setSelectedId(
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                    >
                        <option value="">Choose a user…</option>
                        {nonMembers.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
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
                        disabled={selectedId === null}
                        onClick={handleAdd}
                    >
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
