import type { AppView } from "@app";
import type { Group } from "@domain/group";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
    groups: Group[];
    view: AppView;
    canCreateGroup: boolean;
    onAddGroup: () => void;
    onNavigate: (view: AppView) => void;
    onClose?: () => void;
};

export function GroupsSection({
    groups,
    view,
    canCreateGroup,
    onAddGroup,
    onNavigate,
    onClose,
}: Props) {
    return (
        <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Groups
                </h2>

                <Button
                    size="icon-xs"
                    variant="ghost"
                    disabled={!canCreateGroup}
                    onClick={onAddGroup}
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
                                    aria-current={isActive ? "page" : undefined}
                                    className={`w-full cursor-pointer text-left px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary active:bg-primary/20" : "hover:bg-muted/60 text-foreground active:bg-muted/80"}`}
                                    onClick={() => {
                                        onNavigate({
                                            screen: "group",
                                            groupId: group.id,
                                        });

                                        onClose?.();
                                    }}
                                >
                                    <span
                                        className={`block text-sm truncate ${isActive ? "font-medium" : ""}`}
                                    >
                                        {group.name}
                                    </span>

                                    <span className="text-xs text-muted-foreground">
                                        {group.memberIds.length} members
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
