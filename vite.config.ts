import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type UserConfig } from "vite";

export const userConfig: UserConfig = {
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@domain": path.resolve(__dirname, "./src/domain"),
        },
    },
};

// https://vite.dev/config/
export default defineConfig(userConfig);
