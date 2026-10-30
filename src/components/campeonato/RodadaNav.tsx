import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Etapa, Painel } from "@/lib/campeonato/dados";
import { rotuloDoJogo } from "@/lib/campeonato/dados";
import JogoLinha from "./JogoLinha";

// Card "‹ 3ª rodada ›" com os jogos da rodada (estilo ge.globo).
export default function RodadaNav({
  etapas,
  atual,
  painel,
  hrefEtapa,
  hrefJogo,
}: {
  etapas: Etapa[];
  atual: Etapa | undefined;
  painel: Painel;
  hrefEtapa: (id: string) => string;
  hrefJogo?: (jogoId: string) => string;
}) {
  if (!atual) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-slate-800">
        A tabela de jogos ainda não foi gerada.
      </div>
    );
  }
  const i = etapas.findIndex((e) => e.id === atual.id);
  const ant = etapas[i - 1];
  const prox = etapas[i + 1];
  const feitos = atual.jogos.filter((j) => j.status === "encerrado").length;

  const seta = (e: Etapa | undefined, dir: "ant" | "prox") =>
    e ? (
      <Link
        href={hrefEtapa(e.id)}
        scroll={false}
        aria-label={dir === "ant" ? `Ver ${e.titulo}` : `Ver ${e.titulo}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-unifique transition hover:bg-unifique-light active:scale-95 dark:text-unifique-teal dark:hover:bg-slate-700"
      >
        {dir === "ant" ? <ChevronLeft size={26} /> : <ChevronRight size={26} />}
      </Link>
    ) : (
      <span className="h-11 w-11" />
    );

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-2 py-1.5 dark:border-slate-700">
        {seta(ant, "ant")}
        <div className="text-center">
          <p className="font-placar text-xl font-bold uppercase tracking-wide text-unifique dark:text-unifique-teal">{atual.titulo}</p>
          <p className="text-[11px] font-medium text-gray-400">
            {feitos}/{atual.jogos.length} jogos encerrados
          </p>
        </div>
        {seta(prox, "prox")}
      </div>

      {/* atalhos para todas as rodadas */}
      {etapas.length > 2 && (
        <div className="rolagem-suave flex gap-1 overflow-x-auto border-b border-gray-100 px-2 py-2 dark:border-slate-700">
          {etapas.map((e) => {
            const completa = e.jogos.every((j) => j.status === "encerrado");
            const viva = e.jogos.some((j) => j.status === "ao_vivo");
            return (
              <Link
                key={e.id}
                href={hrefEtapa(e.id)}
                scroll={false}
                className={`relative flex-none rounded-lg px-2.5 py-1 font-placar text-sm font-semibold uppercase transition ${
                  e.id === atual.id
                    ? "bg-unifique text-white"
                    : completa
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300"
                      : "text-unifique hover:bg-unifique-light dark:text-unifique-teal dark:hover:bg-slate-700"
                }`}
              >
                {e.curto}
                {viva && <span className="ao-vivo-ponto absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />}
              </Link>
            );
          })}
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {atual.jogos.map((j) => (
          <JogoLinha
            key={j.id}
            jogo={j}
            painel={painel}
            rotulo={rotuloDoJogo(j, painel)}
            href={hrefJogo?.(j.id)}
          />
        ))}
      </div>
    </div>
  );
}
