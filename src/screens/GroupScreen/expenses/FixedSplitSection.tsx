import { CurrencyInput } from "@components/CurrencyInput";
import type { EntityId } from "@domain/common";
import type { Member } from "@domain/member";

type Props = {
    members: Member[];
    shares: Map<EntityId, number>;
    total: number;
    onShareChange: (id: EntityId, value: number) => void;
};

export function FixedSplitSection({
    members,
    shares,
    total,
    onShareChange,
}: Props) {
    const fixedSum = Array.from(shares.values()).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Shares</span>
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
                            value={shares.get(m.id) ?? 0}
                            onChange={(value) => onShareChange(m.id, value)}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
