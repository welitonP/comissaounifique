"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

type Estado = { acumulado: number; inicio: number | null };

// Cronômetro da súmula. Fica salvo no aparelho (sobrevive a recarregar a
// página) e preenche sozinho o minuto dos lances (inputs com data-minuto).
export default function Cronometro({ jogoId, iniciarRodando }: { jogoId: string; iniciarRodando?: boolean }) {
  const chave = `crono-${jogoId}`;
  const [estado, setEstado] = useState<Estado>({ acumulado: 0, inicio: null });
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    let salvo: Estado | null = null;
    try {
      salvo = JSON.parse(localStorage.getItem(chave) || "null");
    } catch {
      /* sem storage */
    }
    const zerado = !salvo || (salvo.acumulado === 0 && !salvo.inicio);
    // Jogo acabou de começar: o cronômetro já sai rodando.
    if (iniciarRodando && zerado) setEstado({ acumulado: 0, inicio: Date.now() });
    else if (salvo) setEstado(salvo);
  }, [chave, iniciarRodando]);

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(estado));
    } catch {
      /* sem storage */
    }
  }, [chave, estado]);

  const ms = estado.acumulado + (estado.inicio ? agora - estado.inicio : 0);
  const minuto = Math.floor(ms / 60000);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLInputElement>("input[data-minuto]").forEach((i) => {
      i.value = ms > 0 ? String(minuto + 1) : "";
    });
  }, [minuto, ms]);

  const rodando = estado.inicio != null;
  const mm = String(minuto).padStart(2, "0");
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`numeros font-placar text-5xl font-bold ${rodando ? "text-white" : "text-white/60"}`}>
        {mm}:{ss}
      </span>
      <button
        type="button"
        onClick={() =>
          setEstado((e) => (e.inicio ? { acumulado: e.acumulado + Date.now() - e.inicio, inicio: null } : { ...e, inicio: Date.now() }))
        }
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
          rodando ? "bg-white text-unifique" : "bg-unifique-green text-unifique-dark"
        }`}
        aria-label={rodando ? "Pausar cronômetro" : "Iniciar cronômetro"}
      >
        {rodando ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      <button
        type="button"
        onClick={() => window.confirm("Zerar o cronômetro?") && setEstado({ acumulado: 0, inicio: null })}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95"
        aria-label="Zerar cronômetro"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
