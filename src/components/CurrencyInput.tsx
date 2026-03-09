import { type KeyboardEvent, useId } from "react";

type Props = {
    label: string;
    value: number;
    onChange: (cents: number) => void;
};

function displayCents(cents: number): string {
    return (cents / 100).toFixed(2).replace(".", ",");
}

export function CurrencyInput({ label, onChange, value }: Props) {
    const id = useId();

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        event.preventDefault();

        if (event.key === "Backspace") {
            onChange(Math.floor(value / 10));
            return;
        }

        if (/^\d$/.test(event.key)) {
            onChange(value * 10 + Number(event.key));
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>

            <div className="flex items-center gap-2 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
                <span className="text-muted-foreground select-none">R$</span>

                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    value={displayCents(value)}
                    onChange={() => {}}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent focus:outline-none"
                />
            </div>
        </div>
    );
}
