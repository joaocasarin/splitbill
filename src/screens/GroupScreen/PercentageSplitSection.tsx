import { Input } from "@components/ui/input";
import { BPS_TOTAL, type EntityId } from "@domain/common";
import type { User } from "@domain/user";
import { useId } from "react";

type Props = {
    members: User[];
    shares: Map<EntityId, number>;
    onShareChange: (id: EntityId, percentage: number) => void;
};

export function PercentageSplitSection({
    members,
    shares,
    onShareChange,
}: Props) {
    const baseId = useId();
    const percentageSum = Array.from(shares.values()).reduce(
        (a, b) => a + b,
        0,
    );

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Shares</span>
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
                    <li key={m.id} className="flex items-center gap-2">
                        <label
                            htmlFor={`${baseId}-${m.id}`}
                            className="text-sm w-24 truncate"
                        >
                            {m.name}
                        </label>
                        <div className="flex items-center gap-1 flex-1">
                            <Input
                                id={`${baseId}-${m.id}`}
                                type="number"
                                min={0}
                                max={100}
                                step="any"
                                value={(shares.get(m.id) ?? 0) / 100}
                                onChange={(e) =>
                                    onShareChange(m.id, Number(e.target.value))
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
    );
}
