// @holochain-open-dev/stores (pipe.js) still imports `is_promise` from
// "svelte/internal", a private Svelte 4 module that Svelte 5 removed. The UI only
// uses Svelte's store helpers, so vite aliases that one import to this shim.
// Same implementation as Svelte 4's internal helper.
export function is_promise<T = unknown>(value: unknown): value is PromiseLike<T> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
