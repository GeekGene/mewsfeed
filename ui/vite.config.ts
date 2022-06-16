import { defineConfig } from "vite";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import path from "node:path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  plugins: [
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          // treat all tags with a dash as custom elements
          isCustomElement: (tag) =>
            tag.includes("profile") ||
            tag.includes("context-provider") ||
            tag.includes("agent-avatar") ||
            tag.includes("search-agent"),
        },
      },
    }),

    quasar({
      sassVariables: "src/css/quasar.variables.sass",
    }),
  ],
});
