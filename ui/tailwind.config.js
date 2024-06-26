import daisyui from "daisyui";
import typography from "@tailwindcss/typography";
import daisyuiThemes from "daisyui/src/theming/themes";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      title: ["Syne"],
      content: ["Inter"],
      mono: ["Space Mono"],
    },
    extend: {},
  },
  plugins: [typography, daisyui],
  daisyui: {
    themes: [
      {
        light: {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          ...daisyuiThemes["[data-theme=light]"],
          primary: "#FF5C00",

          "base-100": "#FFFFFF",
          "base-200": "#EDEDED",
          "base-300": "#C2C2C2",
          "base-content": "#000000",

          neutral: "#00000",
          "neutral-focus": "#242424",
          "neutral-content": "#FFFFFF",
        },
      },
      {
        dark: {
          ...daisyuiThemes["[data-theme=dark]"],
          primary: "#FF5C00",

          "base-100": "#000000",
          "base-200": "#242424",
          "base-300": "#616161",
          "base-content": "#FFFFFF",

          neutral: "#FFFFFF",
          "neutral-focus": "#E6E6E6",
          "neutral-content": "#000000",
        },
      },
    ],
  },
};
