import type { EntityId } from "@domain/common";
import type { Member } from "@domain/member";
import { useId } from "react";

type Props = {
    members: Member[];
    participantIds: Set<EntityId>;
    onToggle: (id: EntityId) => void;
};

export function EqualSplitSection({
    members,
    participantIds,
    onToggle,
}: Props) {
    const baseId = useId();

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Participants</span>
            <ul className="flex flex-col gap-1">
                {members.map((m) => (
                    <li key={m.id}>
                        <label
                            htmlFor={`${baseId}-${m.id}`}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <input
                                id={`${baseId}-${m.id}`}
                                type="checkbox"
                                checked={participantIds.has(m.id)}
                                onChange={() => onToggle(m.id)}
                                className="cursor-pointer rounded border-border accent-primary"
                            />
                            {m.name}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
