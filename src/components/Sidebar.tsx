import type { AppView } from "@app";
import { GROUP_MEMBERS_MIN } from "@domain/common";
import { AddGroupModal } from "@screens/HomeScreen/AddGroupModal";
import { AddUsersModal } from "@screens/HomeScreen/AddUsersModal";
import { useAppStore } from "@store";
import { useState } from "react";
import { GroupsSection } from "./GroupsSection";
import { UsersSection } from "./UsersSection";

type Props = {
    view: AppView;
    onNavigate: (view: AppView) => void;
    onClose?: () => void;
};

export function Sidebar({ onNavigate, view, onClose }: Props) {
    const { global } = useAppStore();
    const { groups, users } = global;
    const canCreateGroup = users.length >= GROUP_MEMBERS_MIN;

    const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-6 p-4">
                <UsersSection
                    users={users}
                    onAddUser={() => setIsAddUsersOpen(true)}
                />

                <GroupsSection
                    groups={groups}
                    view={view}
                    canCreateGroup={canCreateGroup}
                    onAddGroup={() => setIsAddGroupOpen(true)}
                    onNavigate={onNavigate}
                    onClose={onClose}
                />
            </div>

            <AddUsersModal
                open={isAddUsersOpen}
                onClose={() => setIsAddUsersOpen(false)}
            />

            <AddGroupModal
                open={isAddGroupOpen}
                onClose={() => setIsAddGroupOpen(false)}
            />
        </>
    );
}
