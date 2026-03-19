import { defineConfig } from "vitest/config";
import { userConfig } from "./vite.config";

export default defineConfig({
    ...userConfig,
    test: {
        environment: "happy-dom",
        setupFiles: ["./tests/vitest.setup.ts"],
        exclude: ["**/node_modules/**", "**/dist/**", "public/**"],
        coverage: {
            provider: "v8",
            thresholds: {
                "100": true,
            },
            enabled: true,
            reportOnFailure: true,
            reporter: ["text", "html"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "**/node_modules/**",
                "**/dist/**",
                "public/**",
                "**/index.ts",
                "**/constants.ts",
                "**/*.schema.ts",
                "**/settlement.rules.ts",
                "src/main.tsx",
                "src/lib/utils.ts",
                "**/*.d.ts",
                "vite.config.ts",
                "vitest.config.ts",
                "tests/helpers/**/*.{ts,tsx}",
                "tests/mocks/**/*.{ts,tsx}",
                "tests/setup/**/*.{ts,tsx}",
                "src/components/ui/**",
            ],
        },
    },
});
