import type { AppView } from "@app";
import type { EntityId } from "@domain/common";

type Props = {
    groupId: EntityId;
    onNavigate: (view: AppView) => void;
};

export function GroupScreen({ groupId }: Props) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Group {groupId}</p>
        </div>
    );
}
