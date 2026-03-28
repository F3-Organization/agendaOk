import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
        setupFiles: ["src/tests/setup.ts"],
        coverage: {
            reporter: ["text", "json", "html"],
            exclude: ["node_modules", "dist"]
        }
    },
    plugins: [swc.vite()]
});
