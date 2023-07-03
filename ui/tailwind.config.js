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
        },
      },
      "dark",
    ],
  },
};
