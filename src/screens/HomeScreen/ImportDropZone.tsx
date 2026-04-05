import { useAppStore } from "@store";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

export function ImportDropZone() {
    const { importGlobal } = useAppStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function processFile(file: File | undefined) {
        if (!file) return;
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            importGlobal((e.target as FileReader).result as string);
            setIsLoading(false);
            if (inputRef.current) inputRef.current.value = "";
        };
        reader.onerror = () => {
            importGlobal("");
            setIsLoading(false);
            if (inputRef.current) inputRef.current.value = "";
        };
        reader.readAsText(file);
    }

    return (
        <>
            <button
                type="button"
                aria-label="Import JSON file"
                data-dragging={isDragging}
                className={`mx-8 flex h-48 cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
                    isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                } ${isLoading ? "pointer-events-none" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    processFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                        inputRef.current?.click();
                }}
            >
                {isLoading ? (
                    <output aria-label="Loading">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </output>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-center text-sm text-muted-foreground">
                            Drop a splitbill JSON file here, or click to browse
                        </p>
                    </>
                )}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => processFile(e.target.files?.[0])}
                onClick={(e) => e.stopPropagation()}
            />
        </>
    );
}
