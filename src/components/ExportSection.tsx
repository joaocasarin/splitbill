import { Download } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
    hasGroups: boolean;
    onExport: () => void;
};

export function ExportSection({ hasGroups, onExport }: Props) {
    if (!hasGroups) return null;

    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Data
            </h2>

            <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onExport}
            >
                <Download className="w-3.5 h-3.5" />
                Export JSON
            </Button>
        </div>
    );
}
