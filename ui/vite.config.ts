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
          isCustomElement: (tag) =>
            tag.includes("profiles-context") ||
            tag.includes("profile-prompt") ||
            tag.includes("agent-avatar"),
        },
      },
    }),

    quasar({
      sassVariables: "src/css/quasar.variables.sass",
    }),
  ],
});
