import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  preview: {
    port: 8080,
    strictPort: true,
  },
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    origin: "http://localhost:8080",
    watch: {
      // Ignore runtime-written files that trigger HMR reload loops
      ignored: [
        '**/logs/**',                      // Runtime log files (root level)
        '**/.claude/**',                   // Claude Code workspace files
        '**/backend/public/uploads/**',    // Backend upload directory
        '**/dist/**',                      // Build output
      ],
    },
    fs: {
      strict: true,  // Prevent serving files outside frontend root
    },
  },
});
