import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

export default defineConfig({
  server: {
    open: true,
  },
  plugins: [
    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          // treat all tags with a dash as custom elements
          isCustomElement: (tag) =>
            tag.includes("profile") || tag.includes("context-provider"),
        },
      },
    }),

    quasar({
      sassVariables: "src/quasar-variables.sass",
    }),
  ],
});
