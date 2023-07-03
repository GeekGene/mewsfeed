// stores/counter.js
import { defineStore } from "pinia";

export interface Theme {
  name: string;
  active: boolean;
}

export const useThemeStore = defineStore("theme", {
  persist: true,
  state: () => ({
    active: "light",
    themes: ["light", "dark"],
  }),
  getters: {
    themesDisplay(): Theme[] {
      return this.themes.map(
        (name: string) =>
          ({
            name,
            active: this.active === name,
          } as Theme)
      );
    },
  },
  actions: {
    set(theme: string) {
      this.active = theme;
      this.apply();
    },
    apply() {
      document.documentElement.setAttribute("data-theme", this.active);
    },
  },
});
