import { defineConfig } from "vite";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
      uicommon: path.resolve(__dirname, "ui-common-library/src"),
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(
            __dirname,
            "../node_modules/@shoelace-style/shoelace/dist/assets"
          ),
          dest: path.resolve(__dirname, "dist/shoelace"),
        },
      ],
    }),

    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          isCustomElement: (tag) =>
            tag.includes("profiles-context") ||
            tag.includes("agent-avatar") ||
            tag.includes("edit-profile") ||
            tag.includes("create-profile") ||
            tag.includes("my-profile"),
        },
      },
    }),

    quasar({
      sassVariables: "src/css/quasar.variables.sass",
    }),
  ],
});
