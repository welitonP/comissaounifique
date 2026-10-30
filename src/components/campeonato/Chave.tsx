import { Trophy } from "lucide-react";
import type { JogoCompleto, Painel } from "@/lib/campeonato/dados";
import { nomeFase, vencedor } from "@/lib/campeonato/motor";
import { fmtDataHora } from "@/lib/datas";
import { Escudo } from "./ui";

// Cartão compacto de um jogo dentro da chave.
function JogoChave({ jogo, painel }: { jogo: JogoCompleto; painel: Painel }) {
  const venc = vencedor(jogo);
  const aoVivo = jogo.status === "ao_vivo";
  const linha = (id: string | null, placar: number | null, pens: number | null) => {
    const t = id ? painel.times.get(id) : null;
    const ganhou = venc && id === venc;
    const perdeu = venc && id && id !== venc;
    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 ${
          ganhou ? "bg-gradient-to-r from-unifique-green/25 to-transparent" : ""
        }`}
      >
        <Escudo time={t} size={22} />
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            ganhou
              ? "font-bold text-gray-900 dark:text-white"
              : perdeu
                ? "text-gray-400 line-through decoration-gray-300 dark:text-slate-500"
                : t
                  ? "font-medium text-gray-700 dark:text-slate-200"
                  : "italic text-gray-400"
          }`}
        >
          {t?.name ?? (jogo.status === "folga" ? "—" : "A definir")}
        </span>
        {placar != null && (
          <span className="font-display text-sm font-extrabold tabular-nums text-unifique dark:text-unifique-teal">
            {placar}
            {pens != null && <sup className="ml-0.5 text-[9px] text-gray-400">({pens})</sup>}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl ${aoVivo ? "borda-viva" : ""}`}
      title={jogo.date ? fmtDataHora(jogo.date) : undefined}
    >
      <div
        className={`divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md dark:divide-slate-700 dark:bg-slate-800 ${
          jogo.status === "folga" ? "opacity-60 ring-gray-100 dark:ring-slate-700" : "ring-gray-100 dark:ring-slate-700"
        }`}
      >
        {linha(jogo.homeId, jogo.homeScore, jogo.homePens)}
        {linha(jogo.awayId, jogo.awayScore, jogo.awayPens)}
      </div>
    </div>
  );
}

export default function Chave({ painel }: { painel: Painel }) {
  const jogos = painel.jogosMata;
  if (jogos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800">
        <Trophy size={34} className="mx-auto text-gray-300" />
        <p className="mt-2 font-display font-semibold text-gray-700 dark:text-slate-200">Chaveamento em breve</p>
        <p className="text-sm text-gray-500">
          {painel.cup.format === "grupos"
            ? "A chave sai quando a fase de grupos terminar."
            : "A comissão ainda não montou a chave."}
        </p>
      </div>
    );
  }
  const maxRound = Math.max(...jogos.map((j) => j.round));
  const fases = Array.from({ length: maxRound }, (_, i) => jogos.filter((j) => j.round === i + 1).sort((a, b) => a.slot - b.slot));
  const campeao = painel.podio.campeao ? painel.times.get(painel.podio.campeao) : null;

  return (
    <div className="space-y-4">
      <div className="rolagem-suave -mx-4 overflow-x-auto px-4 pb-3">
        <div className="chave">
          {fases.map((lista, i) => {
            const pares: JogoCompleto[][] = [];
            if (i === fases.length - 1) pares.push(lista);
            else for (let k = 0; k < lista.length; k += 2) pares.push(lista.slice(k, k + 2));
            return (
              <div key={i} className="chave-fase">
                <h4 className="mb-2 rounded-lg bg-unifique/10 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-unifique dark:bg-unifique-blue/15 dark:text-unifique-teal">
                  {nomeFase(lista.length)}
                </h4>
                <div className="chave-jogos">
                  {pares.map((par, k) => (
                    <div key={k} className={i === fases.length - 1 ? "flex flex-1 flex-col" : "chave-par"}>
                      {par.map((j) => (
                        <div key={j.id} className="chave-slot">
                          <JogoChave jogo={j} painel={painel} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex w-40 flex-col items-center justify-center text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
                campeao
                  ? "trofeu-pulo bg-gradient-to-br from-unifique-yellow to-amber-500 shadow-[0_0_40px_rgba(245,236,90,0.6)]"
                  : "bg-gray-100 dark:bg-slate-800"
              }`}
            >
              <Trophy size={38} className={campeao ? "text-unifique-dark" : "text-gray-300"} />
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Campeão</p>
            <p className="font-display text-sm font-bold text-unifique dark:text-unifique-teal">{campeao?.name ?? "?"}</p>
          </div>
        </div>
      </div>

      {painel.terceiro && (
        <div className="max-w-xs">
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Disputa de 3º lugar</h4>
          <JogoChave jogo={painel.terceiro} painel={painel} />
        </div>
      )}
    </div>
  );
}
