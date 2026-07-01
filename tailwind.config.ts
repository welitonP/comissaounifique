import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Unifique (Brandbook 2025)
        unifique: {
          DEFAULT: "#212492", // cor principal (azul)
          dark: "#181a6e", // tom mais escuro para hover
          blue: "#00A2FF", // azul secundário vivo
          teal: "#3FCFD5", // turquesa
          yellow: "#F5EC5A", // amarelo
          green: "#C0F021", // verde exclusivo
          light: "#eef0fb", // fundo claro azulado
        },
      },
    },
  },
  plugins: [],
};

export default config;
