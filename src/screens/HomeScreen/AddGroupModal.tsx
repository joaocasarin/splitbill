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
    GROUP_MEMBERS_MAX,
    GROUP_MEMBERS_MIN,
    GROUP_NAME_MAX,
    GROUP_NAME_MIN,
    USER_NAME_MAX,
    USER_NAME_MIN,
} from "@domain/common";
import { useAppStore } from "@store";
import { useId, useRef, useState } from "react";

type MemberRow = { id: number; name: string };

type Props = {
    open: boolean;
    onClose: () => void;
};

export function AddGroupModal({ open, onClose }: Props) {
    const { addGroupWithMembers } = useAppStore();

    const [groupName, setGroupName] = useState("");
    const [memberRows, setMemberRows] = useState<MemberRow[]>([
        { id: 1, name: "" },
        { id: 2, name: "" },
    ]);
    const nextIdRef = useRef(3);
    const nameInputId = useId();
    const memberBaseId = useId();

    const trimmedName = groupName.trim();
    const isNameValid =
        trimmedName.length >= GROUP_NAME_MIN &&
        trimmedName.length <= GROUP_NAME_MAX;
    const validMembers = memberRows
        .map((r) => r.name.trim())
        .filter((n) => n.length >= USER_NAME_MIN && n.length <= USER_NAME_MAX);
    const canCreate = isNameValid && validMembers.length >= GROUP_MEMBERS_MIN;

    function updateMemberName(id: number, value: string) {
        setMemberRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, name: value } : r)),
        );
    }

    function addMemberRow() {
        const id = nextIdRef.current;
        nextIdRef.current += 1;
        setMemberRows((prev) => [...prev, { id, name: "" }]);
    }

    function removeMemberRow(id: number) {
        setMemberRows((prev) => prev.filter((r) => r.id !== id));
    }

    function handleCreate() {
        if (!canCreate) return;
        addGroupWithMembers(trimmedName, validMembers);
        reset();
        onClose();
    }

    function reset() {
        setGroupName("");
        setMemberRows([
            { id: 1, name: "" },
            { id: 2, name: "" },
        ]);
        nextIdRef.current = 3;
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

                <form
                    data-testid="add-group-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCreate();
                    }}
                >
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor={nameInputId}
                                className="text-sm font-medium"
                            >
                                Name
                            </label>
                            <Input
                                id={nameInputId}
                                placeholder="e.g. Trip to Lisbon"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">Members</span>
                            <ul className="flex flex-col gap-1.5">
                                {memberRows.map((row, idx) => (
                                    <li
                                        key={row.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Input
                                            id={`${memberBaseId}-${row.id}`}
                                            placeholder={`Member ${idx + 1}`}
                                            value={row.name}
                                            onChange={(e) =>
                                                updateMemberName(
                                                    row.id,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {memberRows.length >
                                            GROUP_MEMBERS_MIN && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    removeMemberRow(row.id)
                                                }
                                                aria-label={`Remove member ${idx + 1}`}
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                disabled={
                                    memberRows.length >= GROUP_MEMBERS_MAX
                                }
                                onClick={addMemberRow}
                            >
                                Add member
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!canCreate}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
