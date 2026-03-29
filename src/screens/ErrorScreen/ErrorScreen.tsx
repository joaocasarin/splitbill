import { Button } from "@components/ui/button";
import { useAppStore } from "@store";

export function ErrorScreen() {
    const { initEmpty } = useAppStore();

    function handleBack() {
        initEmpty();
        window.history.replaceState(null, "", window.location.pathname);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-sm">
                Invalid or corrupted state.
            </p>
            <Button variant="outline" size="sm" onClick={handleBack}>
                Back to home
            </Button>
        </div>
    );
}
