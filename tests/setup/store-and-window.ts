import { useAppStore } from "@store";
import { vi } from "vitest";

type SetupStoreAndWindowParams = {
    restoreMocks?: boolean;
};

const defaultLocation = {
    search: "",
    href: "http://localhost/",
};

/**
 * Apenas reseta a store. Use em testes que não precisam de window/location (ex.: HomeScreen).
 */
export function setupStoreOnly() {
    useAppStore.getState().initEmpty();
}

/**
 * Setup comum para testes que usam a store e o ambiente de browser (window/location/history).
 * Use em beforeEach dos testes de UI e da store.
 * @param options.restoreMocks - se true, chama vi.restoreAllMocks() antes (útil para app.store.test)
 */
export function setupStoreAndWindow(options?: SetupStoreAndWindowParams) {
    useAppStore.getState().initEmpty();

    if (options?.restoreMocks) {
        vi.restoreAllMocks();
    }

    Object.defineProperty(window, "location", {
        value: { ...defaultLocation },
        writable: true,
    });

    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
}
