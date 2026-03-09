/// <reference types="vite/client" />

// Shoelace deep imports lack type declarations under "bundler" moduleResolution
declare module "@shoelace-style/shoelace/dist/utilities/base-path" {
  export function setBasePath(path: string): void;
  export function getBasePath(): string;
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_HC_PORT: number;
  readonly VITE_HC_ADMIN_PORT: number;
}
