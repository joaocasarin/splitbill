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
    GROUP_MEMBERS_MIN,
    GROUP_NAME_MAX,
    GROUP_NAME_MIN,
} from "@domain/common";
import { useAppStore } from "@store";
import { useId, useState } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
};

export function AddGroupModal({ open, onClose }: Props) {
    const { global, addGroup } = useAppStore();
    const users = global.users;

    const [name, setName] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const checkboxBaseId = useId();

    const isNameValid =
        name.trim().length >= GROUP_NAME_MIN &&
        name.trim().length <= GROUP_NAME_MAX;
    const hasSufficientMembers = selectedIds.size >= GROUP_MEMBERS_MIN;
    const canCreate = isNameValid && hasSufficientMembers;

    function toggleMember(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleCreate() {
        addGroup(name.trim(), Array.from(selectedIds));
        reset();
        onClose();
    }

    function reset() {
        setName("");
        setSelectedIds(new Set());
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
                    <DialogTitle>Create group</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor={`${checkboxBaseId}-name`}
                            className="text-sm font-medium"
                        >
                            Name
                        </label>
                        <Input
                            id={`${checkboxBaseId}-name`}
                            placeholder="e.g. Trip to Lisbon"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium">Members</span>
                        <ul className="flex flex-col gap-1">
                            {users.map((user) => (
                                <li key={user.id}>
                                    <label
                                        htmlFor={`${checkboxBaseId}-member-${user.id}`}
                                        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <input
                                            id={`${checkboxBaseId}-member-${user.id}`}
                                            type="checkbox"
                                            checked={selectedIds.has(user.id)}
                                            onChange={() =>
                                                toggleMember(user.id)
                                            }
                                            className="rounded border-border accent-primary"
                                        />
                                        {user.name}
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
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
