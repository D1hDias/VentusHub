import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig(async () => {
    const plugins = [react()];
    return {
        plugins,
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "client", "src"),
                "@shared": path.resolve(__dirname, "shared"),
                "@assets": path.resolve(__dirname, "attached_assets"),
            },
        },
        root: path.resolve(__dirname, "client"),
        build: {
            outDir: path.resolve(__dirname, "dist/public"),
            emptyOutDir: true,
            rollupOptions: {
                external: ['@rollup/rollup-win32-x64-msvc']
            }
        },
        server: {
            fs: {
                strict: true,
                deny: ["**/.*"],
            },
            watch: {
                usePolling: true,
                interval: 100,
            },
            hmr: {
                overlay: true
            }
        },
        esbuild: {
            target: 'es2020'
        },
        optimizeDeps: {
            force: true
        },
    };
});
