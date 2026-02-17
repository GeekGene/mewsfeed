import { useNetworkModeStore } from "@/stores/networkMode";
import { IS_HWC } from "@/utils/client";

export function wrapInput<T>(input: T): { input: T; local: boolean } {
  // Zero-arc nodes must always fetch from network
  if (IS_HWC) {
    return { input, local: false };
  }
  const networkStore = useNetworkModeStore();
  return {
    input,
    local: networkStore.local,
  };
}

// For functions that take no input
export function getLocalOption(): { input: null; local: boolean } {
  // Zero-arc nodes must always fetch from network
  if (IS_HWC) {
    return { input: null, local: false };
  }
  const networkStore = useNetworkModeStore();
  return {
    input: null,
    local: networkStore.local,
  };
}
