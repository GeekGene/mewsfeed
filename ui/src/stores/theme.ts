import { defineStore } from "pinia";
import { setCssVar, Dark } from "quasar";
import { Theme } from "../types/types";
import catSeamlessImageUrl from "../assets/img/cats-seamless-pattern.png";

export const useThemeStore = defineStore("theme", {
  persist: true,
  state: () => ({
    activeThemeIndex: 0,
    themes: [
      {
        name: "Light",
        colors: {
          primary: "#e68702",
          secondary: "#5983a0",
          accent: "#e68702",
          dark: "#1D1D1D",
          positive: "#21BA45",
          negative: "#C10015",
          info: "#F8FAFC",
          warning: "#F2C037",
          content: "#3D4852",
        },
        darkMode: false,
        backgroundColor: "#ffffff",
        backgroundOpacity: 0,
      },
      {
        name: "Dark",
        colors: {
          primary: "#3D4852",
          secondary: "#5983a0",
          accent: "#e68702",
          dark: "#1D1D1D",
          positive: "#21BA45",
          negative: "#C10015",
          info: "#2F365F",
          warning: "#F2C037",
          content: "#FFF",
        },
        darkMode: true,
        backgroundColor: "#1D1D1D",
        backgroundOpacity: 0,
      },
      {
        name: "Cat",
        colors: {
          primary: "#e68702",
          secondary: "#5983a0",
          accent: "#e68702",
          dark: "#1D1D1D",
          positive: "#21BA45",
          negative: "#C10015",
          info: "#F8FAFC",
          warning: "#F2C037",
          content: "#fff",
        },
        darkMode: false,
        backgroundOpacity: 0.5,
        backgroundImage: catSeamlessImageUrl,
      },
    ] as Theme[],
  }),
  getters: {
    activeTheme: (state) => state.themes[state.activeThemeIndex] as Theme,
    activeThemeLayoutStyle() {
      if (this.activeTheme.backgroundImage) {
        return {
          backgroundImage: `url(${this.activeTheme.backgroundImage})`,
          backgroundRepeat: "repeat",
        };
      } else if (this.activeTheme.backgroundColor) {
        return {
          backgroundColor: this.activeTheme.backgroundColor,
        };
      } else {
        return {};
      }
    },
    themeNames: (state) => state.themes.map((t) => t.name),
  },
  actions: {
    set(name: string) {
      this.activeThemeIndex = this.themes.findIndex((t) => t.name === name);
      this.applyActiveTheme();
    },
    applyActiveTheme() {
      // Apply colors
      if (this.activeTheme.colors) {
        Object.entries(this.activeTheme.colors).forEach(([key, value]) => {
          setCssVar(key, value);
        });
      }

      // Apply quasar 'dark mode'
      Dark.set(this.activeTheme.darkMode);
    },
  },
});
