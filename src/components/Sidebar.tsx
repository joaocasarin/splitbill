import type { AppView } from "@app";
import { AddGroupModal } from "@screens/HomeScreen/AddGroupModal";
import { useAppStore } from "@store";
import { useState } from "react";
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
            </div>

            <AddGroupModal
                open={isAddGroupOpen}
                onClose={() => setIsAddGroupOpen(false)}
            />
        </>
    );
}
