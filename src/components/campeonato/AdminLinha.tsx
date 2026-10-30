import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { JogoCompleto, Painel } from "@/lib/campeonato/dados";
import { saveMatch } from "@/lib/campeonato-actions";
import { fmtHora, TZ_BRASIL } from "@/lib/datas";
import { Escudo } from "./ui";

// Linha de lançamento rápido: digita o placar e confirma, sem abrir nada.
// "Súmula" abre o controle completo do jogo (ao vivo, gols, cartões).
export default function AdminLinha({
  jogo,
  painel,
  rotulo,
  voltar,
}: {
  jogo: JogoCompleto;
  painel: Painel;
  rotulo: string;
  voltar: string;
}) {
  const casa = jogo.homeId ? painel.times.get(jogo.homeId) : null;
  const fora = jogo.awayId ? painel.times.get(jogo.awayId) : null;
  const definido = !!(casa && fora);
  const sumula = `/admin/campeonatos/${painel.cup.id}/jogo/${jogo.id}`;
  const aoVivo = jogo.status === "ao_vivo";
  const encerrado = jogo.status === "encerrado";
  const dia = jogo.date
    ? new Date(jogo.date).toLocaleDateString("pt-BR", { timeZone: TZ_BRASIL, day: "2-digit", month: "2-digit" })
    : null;
  const inputPlacar =
    "numeros h-10 w-14 flex-none rounded-xl border border-gray-300 text-center font-placar text-2xl font-bold focus:border-unifique-blue dark:border-slate-600 dark:bg-slate-900";

  if (jogo.status === "folga") return null;

  return (
    <div
      id={`j-${jogo.id}`}
      className={`scroll-mt-36 px-3 py-2.5 ${aoVivo ? "bg-red-50 dark:bg-[#2a1520]" : encerrado ? "bg-gray-50 dark:bg-slate-800/80" : "bg-white dark:bg-slate-800"}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate font-bold uppercase tracking-wider text-gray-400">
          {rotulo}
          {jogo.location && ` · ${jogo.location}`}
        </span>
        <span className="flex-none font-semibold">
          {aoVivo ? (
            <span className="inline-flex items-center gap-1 text-red-500">
              <span className="ao-vivo-ponto h-1.5 w-1.5 rounded-full bg-red-500" /> AO VIVO
            </span>
          ) : encerrado ? (
            <span className="text-green-600">✓ Encerrado</span>
          ) : dia ? (
            <span className="text-unifique dark:text-unifique-teal">{dia} · {fmtHora(jogo.date!)}</span>
          ) : (
            <span className="text-gray-400">Sem horário</span>
          )}
        </span>
      </div>

      {!definido ? (
        <div className="flex items-center gap-2 text-sm italic text-gray-400">
          <Escudo time={casa} size={24} /> {casa?.name ?? "A definir"} × {fora?.name ?? "A definir"} <Escudo time={fora} size={24} />
        </div>
      ) : (
        <form action={saveMatch} className="flex items-stretch gap-2">
          <input type="hidden" name="id" value={jogo.id} />
          <input type="hidden" name="voltar" value={`${voltar}#j-${jogo.id}`} />
          <input type="hidden" name="encerrar" value="1" />
          <div className="min-w-0 flex-1 space-y-1.5">
            {[
              [casa, "homeScore", jogo.homeScore],
              [fora, "awayScore", jogo.awayScore],
            ].map(([t, campo, valor]) => {
              const time = t as NonNullable<typeof casa>;
              return (
                <label key={String(campo)} className="flex items-center gap-2">
                  <Escudo time={time} size={26} />
                  <span className="min-w-0 flex-1 line-clamp-3 break-words leading-tight text-[15px] font-semibold">{time.name}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    name={String(campo)}
                    min={0}
                    required
                    defaultValue={(valor as number | null) ?? ""}
                    aria-label={`Placar ${time.name}`}
                    className={inputPlacar}
                  />
                </label>
              );
            })}
          </div>
          <div className="flex w-[76px] flex-none flex-col gap-1.5">
            <button
              type="submit"
              title="Salvar e encerrar"
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-unifique text-xs font-bold text-white shadow transition hover:bg-unifique-dark active:scale-95"
            >
              <Check size={16} strokeWidth={3} /> {encerrado ? "Salvar" : "Encerrar"}
            </button>
            <Link
              href={sumula}
              className={`flex flex-1 items-center justify-center gap-0.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                aoVivo ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200"
              }`}
            >
              {aoVivo ? "Ao vivo" : "Súmula"} <ChevronRight size={14} />
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
