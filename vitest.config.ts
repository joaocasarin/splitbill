import { defineConfig } from "vitest/config";
import { userConfig } from "./vite.config";

export default defineConfig({
    ...userConfig,
    test: {
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
                "**/*.d.ts",
                "vite.config.ts",
                "vitest.config.ts",
            ],
        },
    },
});
