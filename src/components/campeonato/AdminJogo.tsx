import { Minus, Play, Plus, Trash2 } from "lucide-react";
import type { JogoCompleto, Painel } from "@/lib/campeonato/dados";
import { addEvent, deleteEvent, placarRapido, saveMatch, setMatchStatus } from "@/lib/campeonato-actions";
import { toInputLocal } from "@/lib/datas";
import SubmitButton from "@/components/form/SubmitButton";
import { Escudo, StatusJogo } from "./ui";

const ROTULO_LANCE: Record<string, string> = { gol: "⚽", amarelo: "🟨", vermelho: "🟥", destaque: "⭐" };

// Painel de controle de um jogo (área da comissão).
export default function AdminJogo({
  jogo,
  painel,
  rotulo,
  voltar,
}: {
  jogo: JogoCompleto;
  painel: Painel;
  rotulo: string;
  voltar: string; // página atual (com filtro), para onde cada ação retorna
}) {
  const volta = <input type="hidden" name="voltar" value={`${voltar}#j-${jogo.id}`} />;
  const { esp } = painel;
  const casa = jogo.homeId ? painel.times.get(jogo.homeId) : null;
  const fora = jogo.awayId ? painel.times.get(jogo.awayId) : null;
  const definido = !!(casa && fora);
  const aoVivo = jogo.status === "ao_vivo";
  const mataMata = jogo.stage !== "grupo";
  const lanceRotulo = esp.rotuloLance ?? "Ponto";
  const tiposLance = [
    ...(esp.rotuloLance ? [["gol", esp.rotuloLance]] : []),
    ...(esp.cartoes ? [["amarelo", "Cartão amarelo"], ["vermelho", "Cartão vermelho"]] : []),
    ["destaque", "Craque do jogo"],
  ];

  if (jogo.status === "folga") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800/60">
        <Escudo time={casa ?? fora} size={26} />
        <span><b>{(casa ?? fora)?.name}</b> passa direto para a próxima fase.</span>
      </div>
    );
  }

  const botaoPlacar = (lado: "home" | "away", delta: 1 | -1) => (
    <form action={placarRapido}>
      <input type="hidden" name="id" value={jogo.id} />
      {volta}
      <input type="hidden" name="lado" value={lado} />
      <input type="hidden" name="delta" value={delta} />
      <button
        type="submit"
        aria-label={`${delta > 0 ? "Somar" : "Tirar"} ${lado === "home" ? casa?.name : fora?.name}`}
        className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold shadow-sm transition hover:scale-105 ${
          delta > 0 ? "bg-unifique-green text-unifique-dark" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300"
        }`}
      >
        {delta > 0 ? <Plus size={18} strokeWidth={3} /> : <Minus size={16} strokeWidth={3} />}
      </button>
    </form>
  );

  return (
    <article id={`j-${jogo.id}`} className={`scroll-mt-28 rounded-2xl ${aoVivo ? "borda-viva" : ""}`}>
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-400">{rotulo}</span>
          <StatusJogo status={jogo.status} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Escudo time={casa} size={34} />
            <span className="truncate font-display font-semibold">{casa?.name ?? "A definir"}</span>
          </div>
          <div className="flex items-center gap-1.5 font-display text-2xl font-extrabold tabular-nums">
            {aoVivo && definido && botaoPlacar("home", -1)}
            {aoVivo && definido && botaoPlacar("home", 1)}
            <span className={`rounded-xl px-3 py-1 ${aoVivo ? "bg-red-500 text-white" : "bg-unifique text-white"}`}>
              {jogo.homeScore ?? "–"} <span className="text-sm opacity-60">×</span> {jogo.awayScore ?? "–"}
            </span>
            {aoVivo && definido && botaoPlacar("away", 1)}
            {aoVivo && definido && botaoPlacar("away", -1)}
          </div>
          <div className="flex min-w-0 flex-row-reverse items-center gap-2 text-right">
            <Escudo time={fora} size={34} />
            <span className="truncate font-display font-semibold">{fora?.name ?? "A definir"}</span>
          </div>
        </div>
        {jogo.homePens != null && (
          <p className="mt-1 text-center text-xs text-gray-500">Pênaltis {jogo.homePens} × {jogo.awayPens}</p>
        )}
        {jogo.partials && <p className="mt-1 text-center text-xs tabular-nums text-gray-500">{jogo.partials}</p>}

        {!definido ? (
          <p className="mt-3 text-center text-xs text-gray-400">Aguardando os jogos anteriores.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {jogo.status === "agendado" && (
              <form action={setMatchStatus}>
                <input type="hidden" name="id" value={jogo.id} />
                {volta}
                <input type="hidden" name="status" value="ao_vivo" />
                <SubmitButton pendingText="Iniciando..." className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-red-600">
                  <Play size={15} fill="currentColor" /> Começar jogo (ao vivo)
                </SubmitButton>
              </form>
            )}

            <details className="details-suave group rounded-xl bg-gray-50 dark:bg-slate-900/50" open={aoVivo}>
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-unifique dark:text-unifique-teal">
                {jogo.status === "encerrado" ? "Corrigir resultado" : "Lançar resultado"}
              </summary>
              <form action={saveMatch} className="space-y-3 px-3 pb-3">
                <input type="hidden" name="id" value={jogo.id} />
                {volta}
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <label className="block">
                    <span className="block truncate text-xs text-gray-500">{casa?.name}</span>
                    <input type="number" name="homeScore" min={0} max={999} defaultValue={jogo.homeScore ?? ""} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-display text-lg font-bold dark:border-slate-600 dark:bg-slate-900" />
                  </label>
                  <span className="pb-2 font-bold text-gray-400">×</span>
                  <label className="block text-right">
                    <span className="block truncate text-xs text-gray-500">{fora?.name}</span>
                    <input type="number" name="awayScore" min={0} max={999} defaultValue={jogo.awayScore ?? ""} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-display text-lg font-bold dark:border-slate-600 dark:bg-slate-900" />
                  </label>
                </div>
                {esp.placar === "sets" && (
                  <label className="block">
                    <span className="text-xs text-gray-500">Parciais dos {esp.rotuloPlacar.toLowerCase()} (opcional — calcula o placar sozinho)</span>
                    <input name="partials" defaultValue={jogo.partials ?? ""} placeholder="25-20, 23-25, 15-12" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                  </label>
                )}
                {mataMata && esp.placar !== "sets" && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-gray-500">Pênaltis {casa?.name} (se empatar)</span>
                      <input type="number" name="homePens" min={0} defaultValue={jogo.homePens ?? ""} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-900" />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500">Pênaltis {fora?.name}</span>
                      <input type="number" name="awayPens" min={0} defaultValue={jogo.awayPens ?? ""} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-900" />
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs text-gray-500">Data e hora</span>
                    <input type="datetime-local" name="date" defaultValue={toInputLocal(jogo.date)} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Local / quadra</span>
                    <input name="location" defaultValue={jogo.location ?? ""} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                  </label>
                </div>
                <input type="hidden" name="status" value={jogo.status === "encerrado" ? "encerrado" : jogo.status} />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="encerrar" value="1" className="flex-1 rounded-xl bg-unifique px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-unifique-dark">
                    {jogo.status === "encerrado" ? "Salvar resultado" : "Salvar e encerrar"}
                  </button>
                  {jogo.status !== "encerrado" && (
                    <button type="submit" className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-white dark:border-slate-600 dark:text-slate-300">
                      Só salvar
                    </button>
                  )}
                </div>
              </form>
              {jogo.status === "encerrado" && (
                <form action={setMatchStatus} className="px-3 pb-3">
                  <input type="hidden" name="id" value={jogo.id} />
                  {volta}
                  <input type="hidden" name="status" value="ao_vivo" />
                  <button type="submit" className="text-xs font-semibold text-gray-500 underline">Reabrir jogo (voltar a ao vivo)</button>
                </form>
              )}
            </details>

            <details className="details-suave rounded-xl bg-gray-50 dark:bg-slate-900/50">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-unifique dark:text-unifique-teal">
                Lances {jogo.events.length > 0 && `(${jogo.events.length})`}
              </summary>
              <div className="space-y-3 px-3 pb-3">
                {jogo.events.length > 0 && (
                  <ul className="divide-y divide-gray-100 rounded-lg bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
                    {jogo.events.map((ev) => (
                      <li key={ev.id} className="flex items-center gap-2 px-3 py-1.5">
                        <span>{ev.kind === "gol" && esp.placar !== "gols" ? esp.emoji : ROTULO_LANCE[ev.kind]}</span>
                        {ev.minute != null && <span className="text-xs text-gray-400">{ev.minute}&apos;</span>}
                        <span className="min-w-0 flex-1 truncate">
                          <b>{ev.player}</b>{" "}
                          <span className="text-gray-400">· {ev.teamId ? painel.times.get(ev.teamId)?.name : ""}</span>
                        </span>
                        <form action={deleteEvent}>
                          <input type="hidden" name="id" value={ev.id} />
                          {volta}
                          <button type="submit" aria-label="Apagar lance" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
                <form action={addEvent} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.3fr_70px_auto]">
                  <input type="hidden" name="matchId" value={jogo.id} />
                  {volta}
                  <select name="kind" className="rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
                    {tiposLance.map(([v, r]) => (
                      <option key={v} value={v}>{r}</option>
                    ))}
                  </select>
                  <select name="teamId" className="rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900">
                    <option value={casa!.id}>{casa!.name}</option>
                    <option value={fora!.id}>{fora!.name}</option>
                  </select>
                  <input name="player" required list={`atletas-${jogo.id}`} placeholder="Atleta" className="rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                  <datalist id={`atletas-${jogo.id}`}>
                    {[casa!, fora!].flatMap((t) => (t.players ?? "").split("\n").filter(Boolean)).map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  <input type="number" name="minute" min={0} max={200} placeholder="Min" className="rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                  <button type="submit" className="rounded-lg bg-unifique-blue px-3 py-2 text-sm font-bold text-white">+ Lançar</button>
                </form>
                {esp.rotuloLance && esp.placar === "gols" && (
                  <p className="text-[11px] text-gray-500">Cada {lanceRotulo.toLowerCase()} lançado já soma no placar.</p>
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </article>
  );
}
