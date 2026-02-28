import type { EntityId } from "@domain/common";
import { ErrorScreen } from "@screens/ErrorScreen";
import { GroupScreen } from "@screens/GroupScreen";
import { HomeScreen } from "@screens/HomeScreen";
import { useAppStore } from "@store";
import { useEffect, useState } from "react";

export type AppView =
    | { screen: "home" }
    | { screen: "group"; groupId: EntityId };

export function App() {
    const { status } = useAppStore();
    const [view, setView] = useState<AppView>({ screen: "home" });

    useEffect(() => {
        useAppStore.getState().hydrateFromUrl();
    }, []);

    if (status === "error") {
        return <ErrorScreen />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {view.screen === "home" && <HomeScreen onNavigate={setView} />}
            {view.screen === "group" && (
                <GroupScreen groupId={view.groupId} onNavigate={setView} />
            )}
        </div>
    );
}
