import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { type EntityId, USER_NAME_MAX, USER_NAME_MIN } from "@domain/common";
import { useAppStore } from "@store";
import { useId, useState } from "react";

type Props = {
    groupId: EntityId;
    open: boolean;
    onClose: () => void;
};

export function AddMemberModal({ groupId, open, onClose }: Props) {
    const { addMemberByName } = useAppStore();
    const [name, setName] = useState("");
    const inputId = useId();

    const trimmed = name.trim();
    const canAdd =
        trimmed.length >= USER_NAME_MIN && trimmed.length <= USER_NAME_MAX;

    function handleAdd() {
        if (!canAdd) return;
        addMemberByName(groupId, trimmed);
        reset();
        onClose();
    }

    function reset() {
        setName("");
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
                    <DialogTitle>Add member</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-1.5 py-2">
                    <label htmlFor={inputId} className="text-sm font-medium">
                        Name
                    </label>
                    <input
                        id={inputId}
                        type="text"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Member name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button size="sm" disabled={!canAdd} onClick={handleAdd}>
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
