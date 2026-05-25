import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import Sitemap from "vite-plugin-sitemap";
import { getBlogRoutes } from "./scripts/getBlogRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDistPlugin = {
  name: "ensure-dist",
  buildStart() {
    const distPath = path.resolve(__dirname, "dist");
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
  },
};

export default defineConfig(async () => {
  const blogRoutes = await getBlogRoutes();

  return {
    plugins: [
      ensureDistPlugin,
      react(),
      tailwindcss(),
      viteSingleFile(),
      Sitemap({
        hostname: "https://epubforge.com",
        dynamicRoutes: [
          "/",
          "/blog",
          ...blogRoutes,
        ],
        robots: [
          {
            userAgent: "*",
            allow: "/",
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});