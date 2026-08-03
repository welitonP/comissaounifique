import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "barbearia": preto fosco + dourado envelhecido
        barba: {
          preto: "#0b0b0d",
          carvao: "#141418",
          grafite: "#1e1e24",
          borda: "#2c2c34",
          ouro: "#c9a227",
          ouroClaro: "#e6c65c",
          creme: "#f5f0e6",
          cinza: "#a1a1aa",
        },
      },
      fontFamily: {
        titulo: ["Oswald", "Impact", "sans-serif"],
        corpo: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
