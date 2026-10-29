"use client";

import { useRef, useState } from "react";

// Formulário em etapas com transição: a etapa atual desliza para o lado e a
// próxima entra. Todas as etapas continuam no mesmo <form> (só ficam
// escondidas), então o envio funciona igual. Antes de avançar, confere os
// campos obrigatórios da etapa.
export default function Etapas({
  titulos,
  etapas,
  final,
}: {
  titulos: string[];
  etapas: React.ReactNode[];
  final: React.ReactNode;
}) {
  const [atual, setAtual] = useState(0);
  const [direcao, setDirecao] = useState<"frente" | "volta">("frente");
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const topo = useRef<HTMLDivElement>(null);
  const ultima = atual === etapas.length - 1;

  const irPara = (i: number) => {
    setDirecao(i > atual ? "frente" : "volta");
    setAtual(i);
    requestAnimationFrame(() => {
      const el = topo.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
      // leva o foco para o primeiro campo da nova etapa
      const campo = refs.current[i]?.querySelector<HTMLElement>("input:not([type=hidden]):not(.sr-only), select, textarea");
      campo?.focus({ preventScroll: true });
    });
  };

  const avancar = () => {
    const etapa = refs.current[atual];
    if (etapa) {
      const campos = Array.from(etapa.querySelectorAll<HTMLInputElement>("input, select, textarea"));
      const invalido = campos.find((c) => !c.checkValidity());
      if (invalido) {
        invalido.reportValidity();
        etapa.classList.remove("tremer");
        void etapa.offsetWidth; // reinicia a animação
        etapa.classList.add("tremer");
        return;
      }
    }
    irPara(atual + 1);
  };

  const pct = ((atual + 1) / etapas.length) * 100;

  return (
    <div
      ref={topo}
      className="scroll-mt-24"
      onKeyDown={(e) => {
        // Enter num campo antes da última etapa: avança em vez de enviar.
        const alvo = e.target as HTMLElement;
        if (e.key === "Enter" && !ultima && alvo.tagName === "INPUT") {
          e.preventDefault();
          avancar();
        }
      }}
    >
      {/* progresso */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-2">
          {titulos.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => i < atual && irPara(i)}
              disabled={i > atual}
              className={`flex items-center gap-2 text-left text-sm font-semibold transition-colors duration-300 ${
                i === atual ? "text-unifique dark:text-white" : i < atual ? "text-unifique-blue hover:underline" : "text-gray-400"
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                  i <= atual ? "bg-unifique text-white shadow-md shadow-unifique/30" : "bg-gray-100 text-gray-400 dark:bg-white/10"
                } ${i === atual ? "scale-110" : ""}`}
              >
                {i < atual ? "✓" : i + 1}
              </span>
              <span className={i === atual ? "" : "hidden sm:inline"}>{t}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-unifique to-unifique-blue transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* etapas */}
      <div className="overflow-hidden">
        {etapas.map((conteudo, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            hidden={i !== atual}
            className={i === atual ? (direcao === "frente" ? "etapa-da-direita" : "etapa-da-esquerda") : ""}
          >
            {conteudo}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-5 dark:border-white/10">
        {/* O final fica sempre montado (só escondido) para o "Lembrar meus
            dados" preencher a primeira etapa logo ao abrir a página. */}
        <div hidden={!ultima} className={ultima ? "etapa-da-direita space-y-3" : ""}>
          {final}
          {atual > 0 && (
            <button
              type="button"
              onClick={() => irPara(atual - 1)}
              className="w-full py-2 text-sm font-semibold text-gray-500 hover:text-unifique"
            >
              ← Voltar
            </button>
          )}
        </div>
        {!ultima && (
          <button
            type="button"
            onClick={avancar}
            className="group w-full rounded-xl bg-unifique py-3.5 font-display text-lg font-semibold text-white shadow transition hover:bg-unifique-dark"
          >
            Continuar <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
