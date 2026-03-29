import type { AppView } from "@app";
import { AddGroupModal } from "@screens/HomeScreen/AddGroupModal";
import { useAppStore } from "@store";
import { useState } from "react";
import { ExportSection } from "./ExportSection";
import { GroupsSection } from "./GroupsSection";

type Props = {
    view: AppView;
    onNavigate: (view: AppView) => void;
    onClose?: () => void;
};

export function Sidebar({ onNavigate, view, onClose }: Props) {
    const { global } = useAppStore();
    const { groups } = global;

    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

    function handleExport() {
        const json = JSON.stringify(global, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `splitbill-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <div className="flex flex-col gap-6 p-4">
                <GroupsSection
                    groups={groups}
                    view={view}
                    canCreateGroup={true}
                    onAddGroup={() => setIsAddGroupOpen(true)}
                    onNavigate={onNavigate}
                    onClose={onClose}
                />

                <ExportSection
                    hasGroups={groups.length > 0}
                    onExport={handleExport}
                />
            </div>

            <AddGroupModal
                open={isAddGroupOpen}
                onClose={() => setIsAddGroupOpen(false)}
            />
        </>
    );
}
