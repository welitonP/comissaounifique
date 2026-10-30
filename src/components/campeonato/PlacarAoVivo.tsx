"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { aplicarPonto, lerParciais, type EstadoPlacar, type RegraSetMotor } from "@/lib/campeonato/motor";
import { marcarPonto } from "@/lib/campeonato-actions";
import { Escudo } from "./ui";

type Time = { name: string; color: string };

// Placar da súmula: cada metade da tela é um botão gigante de +1.
// A tela muda na hora (sem esperar o servidor) e os toques vão em fila.
export default function PlacarAoVivo({
  jogoId,
  inicial,
  tipo,
  regra,
  nomeUnidade,
  setsToWin,
  casa,
  fora,
  incrementos,
}: {
  jogoId: string;
  inicial: EstadoPlacar;
  tipo: "gols" | "pontos" | "sets";
  regra?: RegraSetMotor;
  nomeUnidade?: string; // "pontos", "games"...
  setsToWin: number;
  casa: Time;
  fora: Time;
  incrementos: number[];
}) {
  const router = useRouter();
  const [est, setEst] = useState<EstadoPlacar>(inicial);
  const [flash, setFlash] = useState<"home" | "away" | null>(null);
  const pendentes = useRef(0);
  const fila = useRef<Promise<unknown>>(Promise.resolve());

  // Quando a página recarrega com dados novos (e nada está na fila), sincroniza.
  useEffect(() => {
    if (pendentes.current === 0) setEst(inicial);
  }, [inicial.homeScore, inicial.awayScore, inicial.partials, inicial.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function tocar(lado: "home" | "away" | "fechar", delta: number) {
    try {
      navigator.vibrate?.(delta > 0 ? 25 : [15, 40, 15]);
    } catch {
      /* sem vibração */
    }
    const statusAntes = est.status;
    setEst((e) => aplicarPonto(e, lado, delta, tipo, regra, setsToWin));
    if (lado !== "fechar" && delta > 0) {
      setFlash(lado);
      setTimeout(() => setFlash(null), 250);
    }
    pendentes.current++;
    fila.current = fila.current
      .then(() => marcarPonto(jogoId, lado, delta))
      .then((res) => {
        pendentes.current--;
        if (pendentes.current === 0) {
          if (res) setEst(res);
          // Mudou o status (começou/terminou): atualiza o resto da página.
          if (!res || res.status !== statusAntes) router.refresh();
        }
      })
      .catch(() => {
        pendentes.current--;
        router.refresh();
      });
  }

  const encerrado = est.status === "encerrado";
  const agendado = est.status === "agendado";
  const { sets, atual } = lerParciais(est.partials);
  const ehSets = tipo === "sets" && !!regra;
  const numeroSet = sets.length + (encerrado ? 0 : 1);
  // Em jogo de sets mostra os pontos do set atual; encerrado, mostra os sets.
  const pontoCasa = ehSets && !encerrado ? (atual?.[0] ?? 0) : (est.homeScore ?? 0);
  const pontoFora = ehSets && !encerrado ? (atual?.[1] ?? 0) : (est.awayScore ?? 0);
  const venceu = (lado: "home" | "away") =>
    encerrado && (lado === "home" ? (est.homeScore ?? 0) > (est.awayScore ?? 0) : (est.awayScore ?? 0) > (est.homeScore ?? 0));

  const painel = (lado: "home" | "away") => {
    const t = lado === "home" ? casa : fora;
    const ponto = lado === "home" ? pontoCasa : pontoFora;
    const podeSomar = !agendado && !encerrado;
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <button
          type="button"
          disabled={!podeSomar}
          onClick={() => tocar(lado, incrementos[0])}
          aria-label={`Ponto para ${t.name}`}
          className={`relative flex min-h-[220px] flex-col items-center justify-between gap-2 overflow-hidden rounded-3xl p-3 text-white shadow-xl transition active:scale-[0.97] disabled:active:scale-100 sm:min-h-[260px] ${
            flash === lado ? "ring-4 ring-unifique-green" : "ring-1 ring-white/15"
          }`}
          style={{ background: `linear-gradient(160deg, ${t.color}, #12145a 75%)` }}
        >
          <span className="flex w-full flex-col items-center gap-1.5">
            <Escudo time={t} size={40} />
            <span className="line-clamp-2 min-h-[2.5rem] w-full break-words text-center font-placar text-base font-bold uppercase leading-tight">
              {t.name}
            </span>
          </span>
          <span key={ponto} className="placar-pop numeros font-placar text-[88px] font-extrabold leading-none drop-shadow sm:text-[110px]">
            {ponto}
          </span>
          <span className="font-placar text-sm font-bold uppercase tracking-widest text-white/80">
            {venceu(lado) ? "🏆 Venceu" : podeSomar ? `Toque = +${incrementos[0]}` : encerrado ? "Fim" : "Comece o jogo"}
          </span>
          {flash === lado && <span className="pointer-events-none absolute inset-0 animate-ping rounded-3xl bg-white/20" />}
        </button>
        <div className="flex gap-2">
          {incrementos.slice(1).map((n) => (
            <button
              key={n}
              type="button"
              disabled={!podeSomar}
              onClick={() => tocar(lado, n)}
              className="flex-1 rounded-xl bg-unifique-green py-3 font-placar text-xl font-extrabold text-unifique-dark shadow active:scale-95 disabled:opacity-40"
            >
              +{n}
            </button>
          ))}
          <button
            type="button"
            disabled={agendado}
            onClick={() => tocar(lado, -1)}
            aria-label={`Tirar ponto de ${t.name}`}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 py-3 font-placar text-lg font-bold text-white/85 active:scale-95 disabled:opacity-40"
          >
            <Minus size={16} strokeWidth={3} /> 1
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {ehSets && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-white">
          <span className="rounded-full bg-white/15 px-3 py-1 font-placar text-sm font-bold uppercase tracking-wider">
            {encerrado ? "Jogo encerrado" : `${numeroSet}º set · ${nomeUnidade ?? "pontos"}`}
          </span>
          <span className="numeros rounded-full bg-white px-3 py-1 font-placar text-sm font-extrabold text-unifique">
            Sets {est.homeScore ?? 0} × {est.awayScore ?? 0}
          </span>
          {sets.map(([h, a], i) => (
            <span key={i} className="numeros rounded-full bg-black/25 px-2.5 py-1 font-placar text-sm font-semibold text-white/85">
              {h}-{a}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-stretch gap-3">
        {painel("home")}
        {painel("away")}
      </div>

      {ehSets && !encerrado && !agendado && atual && atual[0] !== atual[1] && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => window.confirm(`Fechar o ${numeroSet}º set em ${atual[0]}-${atual[1]}?`) && tocar("fechar", 0)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80"
          >
            <Check size={14} /> Fechar set agora (regra diferente)
          </button>
        </div>
      )}
    </div>
  );
}
