import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  assetsInclude: ["**/*.sql"],
  server: {
    fs: {
      allow: ["../../"],
    },
  },
  resolve: { alias: { $lib: path.resolve("./src/lib") } },
});
