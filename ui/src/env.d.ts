/// <reference types="vite/client" />

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
  readonly VITE_IS_HOLO_HOSTED: boolean;
  readonly VITE_CHAPERONE_SERVER_URL: string;
}
