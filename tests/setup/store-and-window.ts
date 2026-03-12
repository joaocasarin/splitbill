import { useAppStore } from "@store";
import { vi } from "vitest";

type SetupStoreAndWindowParams = {
    restoreMocks?: boolean;
};

const defaultLocation = {
    search: "",
    href: "http://localhost/",
};

export function setupStoreOnly() {
    useAppStore.getState().initEmpty();
}

export function setupStoreAndWindow(options?: SetupStoreAndWindowParams) {
    if (options?.restoreMocks) {
        vi.restoreAllMocks();
    }

    useAppStore.getState().initEmpty();

    Object.defineProperty(window, "location", {
        value: { ...defaultLocation },
        writable: true,
    });

    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
}
