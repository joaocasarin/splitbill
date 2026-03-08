import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { USER_NAME_MIN } from "@domain/common";
import { useAppStore } from "@store";
import { Plus, X } from "lucide-react";
import { useId, useState } from "react";

type NameEntry = { id: string; value: string };

type Props = {
    open: boolean;
    onClose: () => void;
};

function makeEntry(value = ""): NameEntry {
    return { id: crypto.randomUUID(), value };
}

export function AddUsersModal({ open, onClose }: Props) {
    const addUser = useAppStore((s) => s.addUser);
    const [entries, setEntries] = useState<NameEntry[]>([makeEntry()]);
    const inputBaseId = useId();

    const canCreate = entries.every(
        (e) => e.value.trim().length >= USER_NAME_MIN,
    );

    function handleChange(id: string, value: string) {
        setEntries((prev) =>
            prev.map((e) => (e.id === id ? { ...e, value } : e)),
        );
    }

    function handleAddAnother() {
        setEntries((prev) => [...prev, makeEntry()]);
    }

    function handleRemove(id: string) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
    }

    function handleCreate() {
        for (const entry of entries) {
            addUser(entry.value.trim());
        }
        reset();
        onClose();
    }

    function reset() {
        setEntries([makeEntry()]);
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
                    <DialogTitle>Add users</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 py-2">
                    {entries.map((entry, i) => (
                        <div key={entry.id} className="flex items-center gap-2">
                            <Input
                                id={`${inputBaseId}-${i}`}
                                placeholder="Name"
                                value={entry.value}
                                onChange={(e) =>
                                    handleChange(entry.id, e.target.value)
                                }
                                autoFocus={i === entries.length - 1}
                                className="flex-1"
                            />
                            {entries.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleRemove(entry.id)}
                                    aria-label={`Remove ${entry.value || "user"}`}
                                >
                                    <X />
                                </Button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddAnother}
                        className="self-start cursor-pointer active:opacity-70 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add another
                    </button>
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
