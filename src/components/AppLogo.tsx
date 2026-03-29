type Background = "primary" | "secondary" | "none";
type Foreground = "primary" | "secondary" | "none";

type Props = {
    size?: number;
    background?: Background;
    foreground?: Foreground;
    label?: string;
};

export function AppLogo({
    size = 32,
    background = "primary",
    foreground = "primary",
    label,
}: Props) {
    const backgroundClass = {
        primary: "fill-primary",
        secondary: "fill-secondary",
        none: "fill-transparent",
    };

    const foregroundClass = {
        primary: "fill-primary-foreground",
        secondary: "fill-secondary-foreground",
        none: "fill-transparent",
    };

    const svg = (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                width="32"
                height="32"
                rx="8"
                className={backgroundClass[background]}
            />
            <rect
                x="7.5"
                y="10"
                width="4"
                height="12"
                rx="2"
                className={foregroundClass[foreground]}
            />
            <rect
                x="14"
                y="6"
                width="4"
                height="20"
                rx="2"
                className={foregroundClass[foreground]}
            />
            <rect
                x="20.5"
                y="10"
                width="4"
                height="12"
                rx="2"
                className={foregroundClass[foreground]}
            />
        </svg>
    );

    if (!label) return svg;

    return (
        <div className="flex items-center gap-2">
            {svg}
            <span className="font-semibold text-base tracking-tight">
                {label}
            </span>
        </div>
    );
}
