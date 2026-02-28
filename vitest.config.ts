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
            reporter: ["text", "html"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "**/node_modules/**",
                "**/dist/**",
                "public/**",
                "**/index.ts",
                "**/constants.ts",
                "**/*.schema.ts",
                "src/main.tsx",
                "src/lib/utils.ts",
                "**/*.d.ts",
                "vite.config.ts",
                "vitest.config.ts",
                "tests/**/*.setup.{ts,tsx}",
                "src/screens/ErrorScreen/**",
                "src/screens/GroupScreen/**",
            ],
        },
    },
});
