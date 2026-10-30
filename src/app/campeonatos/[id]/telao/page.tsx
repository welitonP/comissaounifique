import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { buscarCampeonato, etapaAtual, etapasDo, montarPainel, rotuloDoJogo, type JogoCompleto, type Painel } from "@/lib/campeonato/dados";
import { formatarParciais, lerParciais, vencedor } from "@/lib/campeonato/motor";
import { fmtHora } from "@/lib/datas";
import AutoRefresh from "@/components/campeonato/AutoRefresh";
import Chave from "@/components/campeonato/Chave";
import Relogio from "@/components/campeonato/Relogio";
import Tabela from "@/components/campeonato/Tabela";
import { Escudo } from "@/components/campeonato/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Telão" };

// Placar grande de um jogo (telão).
function PlacarGrande({ jogo, painel }: { jogo: JogoCompleto; painel: Painel }) {
  const casa = jogo.homeId ? painel.times.get(jogo.homeId) : null;
  const fora = jogo.awayId ? painel.times.get(jogo.awayId) : null;
  const aoVivo = jogo.status === "ao_vivo";
  const venc = vencedor(jogo);
  const temPlacar = jogo.homeScore != null && jogo.status !== "agendado";
  const ehSets = painel.esp.placar === "sets";
  const { sets, atual } = lerParciais(jogo.partials);
  const mostraPontos = ehSets && aoVivo && !!atual;
  const grande = mostraPontos ? `${atual![0]}–${atual![1]}` : temPlacar ? `${jogo.homeScore}–${jogo.awayScore}` : "×";
  const lado = (t: typeof casa) => (
    <div className={`flex min-w-0 flex-1 flex-col items-center gap-2 text-center ${venc && t && venc !== t.id ? "opacity-50" : ""}`}>
      <Escudo time={t} size={64} />
      <span className="line-clamp-2 w-full break-words font-placar text-xl font-bold uppercase leading-tight tracking-wide xl:text-2xl">{t?.name ?? "A definir"}</span>
    </div>
  );
  return (
    <div className={`rounded-3xl ${aoVivo ? "borda-viva" : ""}`}>
      <div className="rounded-3xl bg-[#141858] p-5 ring-1 ring-white/10">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          {aoVivo ? <span className="text-red-400">● Ao vivo</span> : jogo.status === "encerrado" ? "Encerrado" : jogo.date ? fmtHora(jogo.date) : "A seguir"}
          {" · "}
          {rotuloDoJogo(jogo, painel)}
        </p>
        <div className="flex items-center gap-4">
          {lado(casa)}
          <div className="flex-none text-center">
            {mostraPontos && (
              <p className="font-placar text-xs font-bold uppercase tracking-widest text-unifique-teal">
                {sets.length + 1}º set · {painel.esp.set?.nome ?? "pontos"}
              </p>
            )}
            <div key={grande} className={`numeros whitespace-nowrap font-placar text-6xl font-extrabold xl:text-7xl ${aoVivo ? "text-white" : "text-white/80"}`}>
              <span className="placar-pop">{grande}</span>
            </div>
            {mostraPontos && (
              <div className="mt-1">
                <span className="numeros inline-block rounded-full bg-white px-3 py-0.5 font-placar text-base font-extrabold text-unifique">
                  Sets {jogo.homeScore ?? 0}–{jogo.awayScore ?? 0}
                </span>
              </div>
            )}
            {jogo.homePens != null && <p className="text-sm text-white/60">pên. {jogo.homePens}–{jogo.awayPens}</p>}
            {ehSets && sets.length > 0 && (
              <p className="numeros mt-1 text-sm text-white/60">{sets.map(([h, a]) => `${h}-${a}`).join(" · ")}</p>
            )}
            {!ehSets && jogo.partials && <p className="numeros text-sm text-white/60">{formatarParciais(jogo.partials)}</p>}
          </div>
          {lado(fora)}
        </div>
      </div>
    </div>
  );
}

export default async function TelaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUserPage();
  const { id } = await params;
  const cup = await buscarCampeonato(id);
  if (!cup) notFound();
  const painel = montarPainel(cup);
  const etapas = etapasDo(painel);
  const atual = etapaAtual(etapas);
  const destaque = painel.aoVivo.length ? painel.aoVivo : (atual?.jogos ?? []).filter((j) => j.status !== "encerrado").slice(0, 4);
  const ultimos = cup.matches
    .filter((m) => m.status === "encerrado")
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || b.round - a.round)
    .slice(0, 4);
  const campeao = painel.podio.campeao ? painel.times.get(painel.podio.campeao) : null;
  const tabelas = [...painel.tabelas.entries()];

  return (
    <div className="campeonato modo-telao fixed inset-0 z-[80] overflow-y-auto bg-gradient-to-br from-[#0b0d3b] via-unifique-dark to-[#06233f] text-white">
      <div aria-hidden className="anim-aurora pointer-events-none fixed -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-unifique-blue/20 blur-3xl" />
      <div aria-hidden className="anim-aurora pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-unifique-teal/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-[1900px] flex-col gap-6 p-5 lg:p-8">
        <header className="flex items-center gap-4">
          <div className="relative flex-none">
            <span aria-hidden className="anel-logo absolute -inset-1 rounded-full" />
            <Image src="/logo-comissao.png" alt="" width={68} height={68} className="relative h-[68px] w-[68px] rounded-full bg-white object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-unifique-teal">Comissão de Esportes Unifique</p>
            <h1 className="truncate font-placar text-4xl font-extrabold uppercase tracking-wide xl:text-5xl">
              {painel.esp.emoji} {cup.name}
            </h1>
          </div>
          <div className="hidden text-right sm:block">
            <Relogio />
            <div className="mt-1">
              <AutoRefresh segundos={15} aoVivo={painel.aoVivo.length > 0} />
            </div>
          </div>
          <Link href={`/campeonatos/${cup.slug ?? cup.id}`} aria-label="Sair do telão" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X size={22} />
          </Link>
        </header>

        {campeao && (
          <div className="flex items-center justify-center gap-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-unifique-yellow/25 to-amber-500/20 p-5 ring-1 ring-unifique-yellow/40">
            <span className="trofeu-pulo text-5xl">🏆</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-unifique-yellow">Campeão</p>
              <p className="titulo-reflexo font-placar text-5xl font-extrabold uppercase">{campeao.name}</p>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${tabelas.length > 0 ? "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" : ""}`}>
          <section className="space-y-4">
            {destaque.length > 0 && (
              <h2 className="font-placar text-2xl font-bold uppercase tracking-wide text-white/80">
                {painel.aoVivo.length ? "🔴 Ao vivo" : `Próximos jogos · ${atual?.titulo}`}
              </h2>
            )}
            <div className={`grid gap-4 ${destaque.length > 1 ? "2xl:grid-cols-2" : ""}`}>
              {destaque.map((j) => <PlacarGrande key={j.id} jogo={j} painel={painel} />)}
            </div>
            {ultimos.length > 0 && (
              <>
                <h2 className="font-placar text-xl font-bold uppercase tracking-wide text-white/60">Últimos resultados</h2>
                <div className="grid gap-2 md:grid-cols-2">
                  {ultimos.map((j) => {
                    const c = j.homeId ? painel.times.get(j.homeId) : null;
                    const f = j.awayId ? painel.times.get(j.awayId) : null;
                    return (
                      <div key={j.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
                        <Escudo time={c} size={28} />
                        <span className="line-clamp-2 min-w-0 flex-1 break-words font-semibold leading-tight">{c?.name}</span>
                        <span className="numeros font-placar text-2xl font-bold">{j.homeScore}–{j.awayScore}</span>
                        <span className="line-clamp-2 min-w-0 flex-1 break-words text-right font-semibold leading-tight">{f?.name}</span>
                        <Escudo time={f} size={28} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {tabelas.length > 0 && (
          <section className="space-y-4">
              <div className={`grid gap-4 ${tabelas.length > 2 ? "2xl:grid-cols-2" : ""}`}>
                {tabelas.map(([g, linhas]) => (
                  <div key={g} className="[&>div]:bg-white/95 dark:[&>div]:bg-slate-800">
                    <Tabela linhas={linhas} titulo={g ? `Grupo ${g}` : "Classificação"} classificam={cup.format === "grupos" ? cup.qualifiers : 0} placar={painel.esp.placar} compacta />
                  </div>
                ))}
              </div>
          </section>
          )}
        </div>

        {painel.jogosMata.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-placar text-2xl font-bold uppercase tracking-wide text-white/80">🏆 Chaveamento</h2>
            <div className="overflow-x-auto rounded-3xl bg-white/95 p-4 text-gray-900 dark:bg-slate-800">
              <Chave painel={painel} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
