import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type UserConfig } from "vite";

export const userConfig: UserConfig = {
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@app": path.resolve(__dirname, "./src/App.tsx"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@domain": path.resolve(__dirname, "./src/domain"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@lib": path.resolve(__dirname, "./src/lib"),
            "@screens": path.resolve(__dirname, "./src/screens"),
            "@store": path.resolve(__dirname, "./src/store/index.ts"),
            "@tests": path.resolve(__dirname, "./tests"),
        },
    },
};

// https://vite.dev/config/
export default defineConfig(userConfig);
