import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Unifique (Brandbook 2025)
        unifique: {
          DEFAULT: "#212492",
          dark: "#181a6e",
          blue: "#00A2FF",
          teal: "#3FCFD5",
          yellow: "#F5EC5A",
          green: "#C0F021",
          light: "#eef0fb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
