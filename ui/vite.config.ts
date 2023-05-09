import { defineConfig, PluginOption } from "vite";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
      util: "rollup-plugin-node-polyfills/polyfills/util",
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
          dereference: true,
        },
      ],
    }) as PluginOption,

    vue({
      template: {
        transformAssetUrls,
        compilerOptions: {
          isCustomElement: (tag) => tag.includes("-"),
        },
      },
    }),

    quasar({
      sassVariables: "src/css/quasar.variables.sass",
    }) as PluginOption,
  ],
  build: {
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        rollupNodePolyFill(),
      ],
    },
  },
});
