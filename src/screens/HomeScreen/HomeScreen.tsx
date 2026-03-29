import type { AppView } from "@app";
import { useAppStore } from "@store";
import { FolderOpen } from "lucide-react";
import { ImportDropZone } from "./ImportDropZone";

type Props = {
    onNavigate: (view: AppView) => void;
};

export function HomeScreen({ onNavigate: _onNavigate }: Props) {
    const { status } = useAppStore();

    if (status === "empty") {
        return (
            <div className="flex h-full flex-col justify-center min-h-80">
                <ImportDropZone />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-80 text-center px-8 py-20">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-4" />

            <p className="text-muted-foreground text-sm">
                Select a group from the sidebar to get started.
            </p>
        </div>
    );
}
