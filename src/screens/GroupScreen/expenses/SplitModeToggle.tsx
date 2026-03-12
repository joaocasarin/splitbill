import { type SplitMode, SplitModeSchema } from "@domain/expense";

type Props = {
    splitMode: SplitMode;
    onChange: (mode: SplitMode) => void;
};

export function SplitModeToggle({ splitMode, onChange }: Props) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Split</span>

            <div className="flex rounded-md border border-input overflow-hidden">
                {SplitModeSchema.options.map((mode) => (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={splitMode === mode}
                        className={`flex-1 py-1.5 text-sm capitalize transition-colors ${
                            splitMode === mode
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted/60"
                        }`}
                        onClick={() => onChange(mode)}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        </div>
    );
}
