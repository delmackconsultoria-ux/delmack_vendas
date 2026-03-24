import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  define: {
    __VITE_ANALYTICS_ENDPOINT__: JSON.stringify(process.env.VITE_ANALYTICS_ENDPOINT || 'https://manus-analytics.com'),
    __VITE_ANALYTICS_WEBSITE_ID__: JSON.stringify(process.env.VITE_ANALYTICS_WEBSITE_ID || ''),
    __VITE_APP_TITLE__: JSON.stringify(process.env.VITE_APP_TITLE || 'Delmack'),
    __VITE_APP_LOGO__: JSON.stringify(process.env.VITE_APP_LOGO || ''),
  },
  server: {
    host: true,
    hmr: {
      overlay: false,
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
