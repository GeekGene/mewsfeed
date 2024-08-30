import { defineConfig, PluginOption } from "vite";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "tailwindcss";
import Components from "unplugin-vue-components/vite";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";

export default defineConfig({
  server: {
    port: 1420,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || false,
    hmr: process.env.TAURI_DEV_HOST
      ? {
          protocol: "ws",
          host: process.env.TAURI_DEV_HOST,
          port: 1430,
        }
      : undefined,
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
        compilerOptions: {
          isCustomElement: (tag) => tag.includes("-"),
        },
      },
    }),

    Components({
      resolvers: [IconsResolver({ prefix: "icon" })],
    }),

    Icons({ autoInstall: true }) as PluginOption,
  ],
  build: {
    target: "es2020",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: ["es2020"],
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
});
