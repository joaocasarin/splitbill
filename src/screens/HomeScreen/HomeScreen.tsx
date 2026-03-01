import type { AppView } from "@app";
import { Button } from "@components/ui/button";
import { GROUP_MEMBERS_MIN } from "@domain/common";
import { AddUsersModal } from "@screens/HomeScreen/AddUsersModal";
import { useAppStore } from "@store";
import { FolderOpen, Plus, Users } from "lucide-react";
import { useState } from "react";

type Props = {
    onNavigate: (view: AppView) => void;
};

export function HomeScreen({ onNavigate }: Props) {
    const { global } = useAppStore();
    const users = global.users;
    const groups = global.groups;
    const canCreateGroup = users.length >= GROUP_MEMBERS_MIN;

    const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);

    return (
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Splitbill
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Split expenses with friends, no backend needed.
                </p>
            </div>

            {/* Users section */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Users
                    </h2>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddUsersOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add user
                    </Button>
                </div>

                {users.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Start by adding at least two users to create a
                            group.
                        </p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm"
                            >
                                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                    {user.name[0].toUpperCase()}
                                </span>
                                {user.name}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Groups section */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Groups
                    </h2>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!canCreateGroup}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add group
                    </Button>
                </div>

                {groups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {canCreateGroup
                                ? "Now create a group to start sharing expenses with your people."
                                : "Add at least two users to unlock group creation."}
                        </p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                type="button"
                                className="w-full flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors text-left"
                                onClick={() =>
                                    onNavigate({
                                        screen: "group",
                                        groupId: group.id,
                                    })
                                }
                            >
                                <span>{group.name}</span>
                                <span className="text-muted-foreground text-xs">
                                    {group.memberIds.length} members
                                </span>
                            </button>
                        ))}
                    </ul>
                )}
            </section>

            <AddUsersModal
                open={isAddUsersOpen}
                onClose={() => setIsAddUsersOpen(false)}
            />
        </div>
    );
}
