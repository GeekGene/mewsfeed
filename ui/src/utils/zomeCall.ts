import { useNetworkModeStore } from "@/stores/networkMode";

export function wrapInput<T>(input: T): { input: T; local: boolean } {
  const networkStore = useNetworkModeStore();
  return {
    input,
    local: networkStore.local,
  };
}

// For functions that take no input
export function getLocalOption(): { input: null; local: boolean } {
  const networkStore = useNetworkModeStore();
  return {
    input: null,
    local: networkStore.local,
  };
}
