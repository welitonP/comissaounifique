import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, Flag, Play, Trash2 } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { buscarCampeonato, etapasDo, montarPainel, rotuloDoJogo } from "@/lib/campeonato/dados";
import { addEvent, deleteEvent, placarRapido, saveMatch, setMatchStatus } from "@/lib/campeonato-actions";
import { toInputLocal } from "@/lib/datas";
import { vencedor } from "@/lib/campeonato/motor";
import AutoRefresh from "@/components/campeonato/AutoRefresh";
import Cronometro from "@/components/campeonato/Cronometro";
import SubmitButton from "@/components/form/SubmitButton";
import { Escudo } from "@/components/campeonato/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Súmula" };

const ERROS: Record<string, string> = {
  "sem-placar": "Preencha o placar para encerrar.",
  "empate-mata": "Mata-mata não pode terminar empatado: informe os pênaltis.",
  "sem-empate": "Neste esporte não existe empate.",
  lance: "Escolha ou digite o nome do atleta.",
};
const ICONE: Record<string, string> = { gol: "⚽", amarelo: "🟨", vermelho: "🟥", destaque: "⭐" };

// Súmula: controle do jogo pelo celular, na beira da quadra.
export default async function SumulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; jogoId: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireUserPage();
  const [{ id, jogoId }, sp] = await Promise.all([params, searchParams]);
  const cup = await buscarCampeonato(id);
  const jogo = cup?.matches.find((m) => m.id === jogoId);
  if (!cup || !jogo) notFound();
  const painel = montarPainel(cup);
  const { esp } = painel;
  const casa = jogo.homeId ? painel.times.get(jogo.homeId) : null;
  const fora = jogo.awayId ? painel.times.get(jogo.awayId) : null;
  const aqui = `/admin/campeonatos/${cup.id}/jogo/${jogo.id}`;
  const voltar = <input type="hidden" name="voltar" value={aqui} />;
  const aoVivo = jogo.status === "ao_vivo";
  const encerrado = jogo.status === "encerrado";
  const mataMata = jogo.stage !== "grupo";
  const empatado = (jogo.homeScore ?? 0) === (jogo.awayScore ?? 0);
  const venc = vencedor(jogo);

  // Próximo jogo a lançar (para seguir em sequência)
  const ordem = etapasDo(painel).flatMap((e) => e.jogos);
  const idx = ordem.findIndex((m) => m.id === jogo.id);
  const proximo = ordem.slice(idx + 1).find((m) => m.status !== "encerrado" && m.homeId && m.awayId);

  const incrementos = esp.placar === "pontos" && esp.id === "basquete" ? [1, 2, 3] : [1];
  const tiposLance: [string, string][] = [
    ...(esp.rotuloLance ? [["gol", esp.placar === "gols" ? "Gol" : esp.rotuloLance] as [string, string]] : []),
    ...(esp.cartoes ? ([["amarelo", "Amarelo"], ["vermelho", "Vermelho"]] as [string, string][]) : []),
    ["destaque", "Craque"],
  ];

  if (!casa || !fora) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
        <p className="font-placar text-2xl font-bold uppercase text-unifique">{rotuloDoJogo(jogo, painel)}</p>
        <p className="text-gray-500">Este jogo ainda depende do resultado dos jogos anteriores.</p>
        <Link href={`/admin/campeonatos/${cup.id}?aba=jogos`} className="inline-block rounded-xl bg-unifique px-4 py-2 font-semibold text-white">Voltar aos jogos</Link>
      </div>
    );
  }

  const ladoPlacar = (lado: "home" | "away") => {
    const t = lado === "home" ? casa : fora;
    const placar = lado === "home" ? jogo.homeScore : jogo.awayScore;
    const perdeu = encerrado && venc && venc !== t.id;
    return (
      <div className={`flex min-w-0 flex-1 flex-col items-center gap-2 ${perdeu ? "opacity-50" : ""}`}>
        <Escudo time={t} size={56} />
        <div className="flex min-h-[4.2rem] w-full items-center justify-center">
          <p className="line-clamp-3 break-words text-center font-placar text-lg font-bold uppercase leading-tight sm:text-xl">{t.name}</p>
        </div>
        <p key={placar ?? -1} className="placar-pop numeros font-placar text-7xl font-extrabold leading-none sm:text-8xl">{placar ?? 0}</p>
        {aoVivo && (
          <div className="flex w-full flex-col gap-2">
            {incrementos.map((n) => (
              <form key={n} action={placarRapido}>
                <input type="hidden" name="id" value={jogo.id} />
                <input type="hidden" name="lado" value={lado} />
                <input type="hidden" name="delta" value={n} />
                {voltar}
                <button type="submit" className="w-full rounded-2xl bg-unifique-green py-4 font-placar text-2xl font-extrabold text-unifique-dark shadow-lg active:scale-95">
                  +{n} {esp.placar === "sets" ? esp.rotuloPlacar.slice(0, -1) : ""}
                </button>
              </form>
            ))}
            <form action={placarRapido}>
              <input type="hidden" name="id" value={jogo.id} />
              <input type="hidden" name="lado" value={lado} />
              <input type="hidden" name="delta" value={-1} />
              {voltar}
              <button type="submit" className="w-full rounded-xl bg-white/10 py-2 font-placar text-lg font-bold text-white/80 active:scale-95">−1</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="campeonato -mx-4 -my-8 min-h-[calc(100vh-66px)] bg-[#f0f4fb] pb-24 dark:bg-[#0b0f1a]">
      {/* Placar */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${esp.gradiente} text-white`}>
        <div aria-hidden className="absolute inset-0 bg-unifique-dark/80" />
        <div className="relative mx-auto max-w-2xl px-4 pb-6 pt-4">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/admin/campeonatos/${cup.id}?aba=jogos`} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
              <ChevronLeft size={16} /> Jogos
            </Link>
            <p className="truncate text-center font-placar text-sm font-semibold uppercase tracking-widest text-white/70">{rotuloDoJogo(jogo, painel)}</p>
            <Link href={`/campeonatos/${cup.slug ?? cup.id}`} target="_blank" aria-label="Ver página do campeonato" className="rounded-full bg-white/10 p-2">
              <ExternalLink size={16} />
            </Link>
          </div>

          <div className="mt-3 text-center">
            {aoVivo ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
                <span className="ao-vivo-ponto h-2 w-2 rounded-full bg-white" /> Ao vivo
              </span>
            ) : encerrado ? (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">Encerrado</span>
            ) : (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">Não começou</span>
            )}
          </div>

          {esp.placar !== "sets" && !encerrado && (
            <div className="mt-3">
              <Cronometro jogoId={jogo.id} iniciarRodando={aoVivo} />
            </div>
          )}

          <div className="mt-4 flex items-start gap-3">
            {ladoPlacar("home")}
            <span className="pt-24 font-placar text-3xl text-white/40">×</span>
            {ladoPlacar("away")}
          </div>
          {jogo.homePens != null && <p className="mt-2 text-center text-sm text-white/70">Pênaltis {jogo.homePens} × {jogo.awayPens}</p>}
          {jogo.partials && <p className="numeros mt-2 text-center text-sm text-white/70">{jogo.partials}</p>}

          {jogo.status === "agendado" && (
            <form action={setMatchStatus} className="mt-5">
              <input type="hidden" name="id" value={jogo.id} />
              <input type="hidden" name="status" value="ao_vivo" />
              {voltar}
              <SubmitButton pendingText="Começando..." className="btn-brilho flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-4 font-placar text-2xl font-extrabold uppercase tracking-wide text-white shadow-xl">
                <Play size={24} fill="currentColor" /> Começar jogo
              </SubmitButton>
            </form>
          )}
          {aoVivo && <div className="mt-3 flex justify-center"><AutoRefresh segundos={60} aoVivo /></div>}
        </div>
      </section>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {sp.erro && ERROS[sp.erro] && (
          <p className="aviso-entrar rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{ERROS[sp.erro]}</p>
        )}

        {/* Lances: escolhe o tipo e toca no atleta */}
        {jogo.status !== "agendado" && (
          <section className="grid gap-3 sm:grid-cols-2">
            {[casa, fora].map((t) => {
              const atletas = (t.players ?? "").split("\n").map((p) => p.trim()).filter(Boolean);
              return (
                <form key={t.id} action={addEvent} className="space-y-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
                  <input type="hidden" name="matchId" value={jogo.id} />
                  <input type="hidden" name="teamId" value={t.id} />
                  <input type="hidden" name="minute" data-minuto="" />
                  {voltar}
                  <div className="flex items-center gap-2">
                    <Escudo time={t} size={26} />
                    <p className="line-clamp-2 break-words leading-tight font-placar text-lg font-bold uppercase">{t.name}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-slate-900">
                    {tiposLance.map(([v, r], i) => (
                      <label key={v} className="cursor-pointer">
                        <input type="radio" name="kind" value={v} defaultChecked={i === 0} className="peer sr-only" />
                        <span className="flex flex-col items-center rounded-lg py-1.5 text-[11px] font-semibold text-gray-500 transition peer-checked:bg-white peer-checked:text-unifique peer-checked:shadow dark:peer-checked:bg-slate-700 dark:peer-checked:text-white">
                          <span className="text-lg leading-none">{v === "gol" && esp.placar !== "gols" ? esp.emoji : ICONE[v]}</span>
                          {r}
                        </span>
                      </label>
                    ))}
                  </div>
                  {atletas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {atletas.map((a) => (
                        <button
                          key={a}
                          type="submit"
                          name="player"
                          value={a}
                          className="rounded-full border-2 px-3 py-2 text-sm font-semibold transition active:scale-95"
                          style={{ borderColor: t.color }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Dica: cadastre os atletas na aba Equipes para tocar no nome em vez de digitar.</p>
                  )}
                  <div className="flex gap-2">
                    <input name="player" placeholder="Outro atleta" className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                    <button type="submit" className="rounded-xl bg-unifique px-4 text-sm font-bold text-white">Lançar</button>
                  </div>
                </form>
              );
            })}
          </section>
        )}
        {esp.rotuloLance && esp.placar === "gols" && jogo.status !== "agendado" && (
          <p className="text-center text-xs text-gray-500">Gol lançado com o nome do atleta já soma no placar. Use o +1 lá em cima para gol sem nome.</p>
        )}

        {/* Lista de lances */}
        {jogo.events.length > 0 && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            <h2 className="border-b border-gray-100 px-4 py-2.5 font-placar text-lg font-bold uppercase text-unifique dark:border-slate-700 dark:text-unifique-teal">Lances do jogo</h2>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {[...jogo.events].reverse().map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg">{ev.kind === "gol" && esp.placar !== "gols" ? esp.emoji : ICONE[ev.kind]}</span>
                  <span className="w-8 font-placar text-base font-bold text-gray-400">{ev.minute != null ? `${ev.minute}'` : ""}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <b>{ev.player}</b> <span className="text-sm text-gray-400">{ev.teamId ? painel.times.get(ev.teamId)?.name : ""}</span>
                  </span>
                  <form action={deleteEvent}>
                    <input type="hidden" name="id" value={ev.id} />
                    {voltar}
                    <button type="submit" aria-label="Apagar lance" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Encerrar / corrigir */}
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <h2 className="font-placar text-lg font-bold uppercase text-unifique dark:text-unifique-teal">
            {encerrado ? "Corrigir resultado" : "Resultado final"}
          </h2>
          <form action={saveMatch} className="space-y-3">
            <input type="hidden" name="id" value={jogo.id} />
            {voltar}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="block text-center">
                <span className="block truncate text-xs text-gray-500">{casa.name}</span>
                <input type="number" inputMode="numeric" name="homeScore" min={0} defaultValue={jogo.homeScore ?? ""} className="numeros mt-1 w-full rounded-xl border border-gray-300 py-3 text-center font-placar text-3xl font-bold dark:border-slate-600 dark:bg-slate-900" />
              </label>
              <span className="pb-4 text-gray-400">×</span>
              <label className="block text-center">
                <span className="block truncate text-xs text-gray-500">{fora.name}</span>
                <input type="number" inputMode="numeric" name="awayScore" min={0} defaultValue={jogo.awayScore ?? ""} className="numeros mt-1 w-full rounded-xl border border-gray-300 py-3 text-center font-placar text-3xl font-bold dark:border-slate-600 dark:bg-slate-900" />
              </label>
            </div>
            {esp.placar === "sets" && (
              <label className="block">
                <span className="text-xs text-gray-500">Parciais (opcional, calcula o placar sozinho)</span>
                <input name="partials" defaultValue={jogo.partials ?? ""} placeholder="25-20, 23-25, 15-12" inputMode="text" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900" />
              </label>
            )}
            {mataMata && esp.placar !== "sets" && (
              <details open={empatado && (aoVivo || encerrado)} className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                <summary className="cursor-pointer text-sm font-semibold text-amber-800 dark:text-amber-200">Pênaltis (se terminar empatado)</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input type="number" inputMode="numeric" name="homePens" min={0} placeholder={casa.name} defaultValue={jogo.homePens ?? ""} className="rounded-xl border border-gray-300 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-900" />
                  <input type="number" inputMode="numeric" name="awayPens" min={0} placeholder={fora.name} defaultValue={jogo.awayPens ?? ""} className="rounded-xl border border-gray-300 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-900" />
                </div>
              </details>
            )}
            <button type="submit" name="encerrar" value="1" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-unifique py-4 font-placar text-xl font-bold uppercase tracking-wide text-white shadow-lg active:scale-[0.98]">
              <Flag size={20} /> {encerrado ? "Salvar correção" : "Encerrar jogo"}
            </button>
          </form>
          {encerrado && (
            <form action={setMatchStatus}>
              <input type="hidden" name="id" value={jogo.id} />
              <input type="hidden" name="status" value="ao_vivo" />
              {voltar}
              <button type="submit" className="w-full text-center text-xs font-semibold text-gray-500 underline">Reabrir o jogo</button>
            </form>
          )}
        </section>

        {proximo && (
          <Link
            href={`/admin/campeonatos/${cup.id}/jogo/${proximo.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-unifique to-unifique-blue p-4 text-white shadow-lg"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/70">Próximo jogo</span>
              <span className="block truncate font-placar text-lg font-bold uppercase">
                {painel.times.get(proximo.homeId!)?.name} × {painel.times.get(proximo.awayId!)?.name}
              </span>
            </span>
            <ChevronLeft size={22} className="rotate-180" />
          </Link>
        )}

        {/* Data e local */}
        <details className="rounded-2xl bg-white shadow-sm dark:bg-slate-800">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-600 dark:text-slate-300">Data, horário e local</summary>
          <form action={saveMatch} className="grid gap-2 px-4 pb-4 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="id" value={jogo.id} />
            {voltar}
            <input type="datetime-local" name="date" defaultValue={toInputLocal(jogo.date)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
            <input name="location" defaultValue={jogo.location ?? ""} placeholder="Local / quadra" className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
            <button type="submit" className="rounded-xl bg-unifique px-4 py-2 text-sm font-bold text-white">Salvar</button>
          </form>
        </details>
      </div>
    </div>
  );
}
