import type { AppView } from "@app";
import { GROUP_MEMBERS_MIN } from "@domain/common";
import { AddGroupModal } from "@screens/HomeScreen/AddGroupModal";
import { AddUsersModal } from "@screens/HomeScreen/AddUsersModal";
import { useAppStore } from "@store";
import { FolderOpen, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

type Props = {
    view: AppView;
    onNavigate: (view: AppView) => void;
};

export function Sidebar({ onNavigate, view }: Props) {
    const { global } = useAppStore();
    const { groups, users } = global;
    const canCreateGroup = users.length >= GROUP_MEMBERS_MIN;

    const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-6 p-4">
                {/* Users section */}
                <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Users
                        </h2>

                        <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setIsAddUsersOpen(true)}
                            aria-label="Add user"
                        >
                            <Plus />
                        </Button>
                    </div>

                    {users.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
                            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1.5" />
                            <p className="text-xs text-muted-foreground leading-snug">
                                Start by adding at least two users to create a
                                group.
                            </p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-0.5">
                            {users.map((user) => (
                                <li
                                    key={user.id}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm"
                                >
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                        {user.name[0].toUpperCase()}
                                    </span>
                                    <span className="truncate">
                                        {user.name}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Groups section */}
                <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Groups
                        </h2>

                        <Button
                            size="icon-xs"
                            variant="ghost"
                            disabled={!canCreateGroup}
                            onClick={() => setIsAddGroupOpen(true)}
                            aria-label="Add group"
                        >
                            <Plus />
                        </Button>
                    </div>

                    {groups.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
                            <FolderOpen className="w-5 h-5 mx-auto text-muted-foreground mb-1.5" />

                            <p className="text-xs text-muted-foreground leading-snug">
                                {canCreateGroup
                                    ? "Now create a group to start sharing expenses."
                                    : "Add at least two users to unlock group creation."}
                            </p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-0.5">
                            {groups.map((group) => {
                                const isActive =
                                    view.screen === "group" &&
                                    view.groupId === group.id;

                                return (
                                    <li key={group.id}>
                                        <button
                                            type="button"
                                            aria-current={
                                                isActive ? "page" : undefined
                                            }
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"}`}
                                            onClick={() => {
                                                onNavigate({
                                                    screen: "group",
                                                    groupId: group.id,
                                                });
                                            }}
                                        >
                                            <span
                                                className={`block text-sm truncate ${isActive ? "font-medium" : ""}`}
                                            >
                                                {group.name}
                                            </span>

                                            <span className="text-sm text-muted-foreground">
                                                {group.memberIds.length} members
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
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
