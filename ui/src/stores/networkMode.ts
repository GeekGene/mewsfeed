import { defineStore } from "pinia";

export const useNetworkModeStore = defineStore("networkMode", {
  persist: true,
  state: () => ({
    useNetwork: false, // Default to local
  }),
  getters: {
    local: (state) => !state.useNetwork,
  },
  actions: {
    setNetworkMode(useNetwork: boolean) {
      this.useNetwork = useNetwork;
    },
    toggle() {
      this.useNetwork = !this.useNetwork;
    },
  },
});
