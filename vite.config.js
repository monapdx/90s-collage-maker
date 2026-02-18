// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages project site base path:
  // https://monapdx.github.io/90s-collage-maker/
  base: "/90s-collage-maker/",
  plugins: [react()],
});
