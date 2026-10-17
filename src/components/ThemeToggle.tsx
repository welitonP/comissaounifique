"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Botão de alternar tema claro/escuro. A preferência fica salva no navegador
// (localStorage "tema"). O padrão é claro; só vira escuro se a pessoa escolher.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const novo = !dark;
    setDark(novo);
    const el = document.documentElement;
    try {
      if (novo) {
        el.classList.add("dark");
        localStorage.setItem("tema", "escuro");
      } else {
        el.classList.remove("dark");
        localStorage.setItem("tema", "claro");
      }
    } catch {
      // sem localStorage (navegação privada): só alterna na sessão atual
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
