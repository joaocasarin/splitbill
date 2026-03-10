import type { User } from "@domain/user";
import { Plus, Users } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
    users: User[];
    onAddUser: () => void;
};

export function UsersSection({ users, onAddUser }: Props) {
    return (
        <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Users
                </h2>

                <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={onAddUser}
                    aria-label="Add user"
                >
                    <Plus />
                </Button>
            </div>

            {users.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
                    <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1.5" />
                    <p className="text-xs text-muted-foreground leading-snug">
                        Start by adding at least two users to create a group.
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
                            <span className="truncate">{user.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
