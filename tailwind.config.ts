import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        unifique: {
          DEFAULT: "#7c1fa0",
          dark: "#5a1676",
          light: "#a259c6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
