import { CalendarClock, MapPin } from "lucide-react";
import type { JogoCompleto, Painel } from "@/lib/campeonato/dados";
import { formatarParciais, vencedor } from "@/lib/campeonato/motor";
import { fmtDataHora } from "@/lib/datas";
import { Escudo, StatusJogo } from "./ui";

// Card de um jogo na página pública.
export default function JogoCard({ jogo, painel, rotulo }: { jogo: JogoCompleto; painel: Painel; rotulo?: string }) {
  const casa = jogo.homeId ? painel.times.get(jogo.homeId) : null;
  const fora = jogo.awayId ? painel.times.get(jogo.awayId) : null;
  const venc = vencedor(jogo);
  const temPlacar = jogo.homeScore != null && jogo.awayScore != null;
  const aoVivo = jogo.status === "ao_vivo";
  const gols = jogo.events.filter((e) => e.kind === "gol");

  const lado = (t: typeof casa, placar: number | null, pens: number | null, alinhar: "esq" | "dir") => (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 ${
        alinhar === "dir" ? "sm:flex-row-reverse sm:text-right" : "sm:text-left"
      }`}
    >
      <Escudo time={t} size={38} />
      <span
        className={`line-clamp-2 min-w-0 break-words font-display text-sm font-semibold leading-tight sm:text-base ${
          venc && t && venc !== t.id ? "text-gray-400 dark:text-slate-500" : "text-gray-800 dark:text-slate-100"
        }`}
      >
        {t?.name ?? "A definir"}
      </span>
    </div>
  );

  return (
    <article
      id={`j-${jogo.id}`}
      className={`rounded-2xl ${aoVivo ? "borda-viva" : ""}`}
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <span className="truncate">{rotulo}</span>
          <StatusJogo status={jogo.status} />
        </div>

        <div className="flex items-center gap-3">
          {lado(casa, jogo.homeScore, jogo.homePens, "esq")}
          <div className="flex flex-none flex-col items-center">
            {temPlacar ? (
              <div
                key={`${jogo.homeScore}-${jogo.awayScore}`}
                className={`placar-pop flex items-center gap-1.5 rounded-xl px-3 py-1 font-display text-2xl font-extrabold tabular-nums ${
                  aoVivo ? "bg-red-500 text-white" : "bg-unifique text-white"
                }`}
              >
                <span>{jogo.homeScore}</span>
                <span className="text-sm opacity-60">×</span>
                <span>{jogo.awayScore}</span>
              </div>
            ) : (
              <span className="rounded-xl bg-gray-100 px-3 py-1 font-display text-sm font-bold text-gray-400 dark:bg-slate-700">
                VS
              </span>
            )}
            {jogo.homePens != null && jogo.awayPens != null && (
              <span className="mt-1 text-[10px] font-semibold text-gray-500">
                pên. {jogo.homePens} × {jogo.awayPens}
              </span>
            )}
          </div>
          {lado(fora, jogo.awayScore, jogo.awayPens, "dir")}
        </div>

        {jogo.partials && (
          <p className="mt-2 text-center text-xs font-medium tabular-nums text-gray-500">
            {painel.esp.placar === "sets" ? "Parciais: " : ""}
            {formatarParciais(jogo.partials)}
          </p>
        )}

        {gols.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 border-t border-dashed border-gray-100 pt-2 text-xs text-gray-500 dark:border-slate-700">
            <ul>
              {gols.filter((g) => g.teamId === jogo.homeId).map((g) => (
                <li key={g.id} className="truncate">
                  {painel.esp.placar === "gols" ? "⚽" : painel.esp.emoji} {g.player} {g.minute != null && <span className="text-gray-400">{g.minute}&apos;</span>}
                </li>
              ))}
            </ul>
            <ul className="text-right">
              {gols.filter((g) => g.teamId === jogo.awayId).map((g) => (
                <li key={g.id} className="truncate">
                  {g.minute != null && <span className="text-gray-400">{g.minute}&apos;</span>} {g.player} {painel.esp.placar === "gols" ? "⚽" : painel.esp.emoji}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(jogo.date || jogo.location) && jogo.status !== "folga" && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {jogo.date && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={13} className="text-unifique-blue" /> {fmtDataHora(jogo.date)}
              </span>
            )}
            {jogo.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-unifique-blue" /> {jogo.location}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
