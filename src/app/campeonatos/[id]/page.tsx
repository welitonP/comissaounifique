import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, ChevronLeft, MapPin, MonitorPlay, Settings, Users } from "lucide-react";
import {
  buscarCampeonato,
  etapaAtual,
  etapasDo,
  montarPainel,
  rotuloDoJogo,
  tabelaNaoExiste,
  type Painel,
} from "@/lib/campeonato/dados";
import { FORMATOS, type Formato } from "@/lib/campeonato/esportes";
import { requireUserPage } from "@/lib/auth";
import { fmtDataHora } from "@/lib/datas";
import AutoRefresh from "@/components/campeonato/AutoRefresh";
import Campeao from "@/components/campeonato/Campeao";
import Chave from "@/components/campeonato/Chave";
import JogoCard from "@/components/campeonato/JogoCard";
import JogoLinha from "@/components/campeonato/JogoLinha";
import RodadaNav from "@/components/campeonato/RodadaNav";
import Tabela from "@/components/campeonato/Tabela";
import TimeFiltro from "@/components/campeonato/TimeFiltro";
import { Escudo, StatusCampeonato } from "@/components/campeonato/ui";
import ShareLink from "@/components/ShareLink";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; rodada?: string; time?: string }>;
};

async function carregar(id: string) {
  try {
    return await buscarCampeonato(id);
  } catch (e) {
    if (tabelaNaoExiste(e)) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const cup = await carregar(id);
  return { title: cup?.name ?? "Campeonato" };
}

export default async function CampeonatoPage({ params, searchParams }: Params) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, requireUserPage()]);
  const cup = await carregar(id);
  if (!cup) notFound();
  const painel = montarPainel(cup);
  const { esp } = painel;

  const temTabela = cup.format !== "mata";
  const temChave = cup.format !== "liga";
  const abas = [
    { id: "geral", rotulo: "Visão geral" },
    { id: "jogos", rotulo: "Jogos" },
    ...(temTabela ? [{ id: "tabela", rotulo: "Classificação" }] : []),
    ...(temChave ? [{ id: "chave", rotulo: "Chaveamento" }] : []),
    { id: "stats", rotulo: "Estatísticas" },
    { id: "equipes", rotulo: "Equipes" },
  ];
  const aba = abas.some((a) => a.id === sp.aba) ? sp.aba! : "geral";
  const base = `/campeonatos/${cup.slug ?? cup.id}`;
  const etapas = etapasDo(painel);
  const atual = etapas.find((e) => e.id === sp.rodada) ?? etapaAtual(etapas);
  const timeFiltro = sp.time && painel.times.has(sp.time) ? sp.time : undefined;
  const pct = painel.progresso.total ? Math.round((painel.progresso.feitos / painel.progresso.total) * 100) : 0;
  const t = (tid: string | null) => (tid ? painel.times.get(tid) ?? null : null);
  const hrefTime = (tid: string) => `${base}?aba=jogos&time=${tid}`;
  const aoVivo = painel.aoVivo.length > 0;

  const tabelas = [...painel.tabelas.entries()];
  const blocoTabelas = (
    <div className={`grid gap-4 ${tabelas.length > 1 ? "2xl:grid-cols-2" : ""}`}>
      {tabelas.map(([g, linhas]) => (
        <Tabela
          key={g}
          linhas={linhas}
          titulo={g ? `Grupo ${g}` : "Classificação"}
          classificam={cup.format === "grupos" ? cup.qualifiers : 0}
          placar={esp.placar}
          hrefTime={hrefTime}
        />
      ))}
    </div>
  );

  return (
    <div className="campeonato tela-cheia">
      <div className="tela-cheia-miolo space-y-5">
        <Link href="/campeonatos" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
          <ChevronLeft size={16} /> Campeonatos
        </Link>

        {/* Banner compacto */}
        <section className={`banner-vivo relative overflow-hidden rounded-3xl bg-gradient-to-br ${esp.gradiente} text-white shadow-lg`}>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-unifique-dark/90 via-unifique-dark/60 to-transparent" />
          <span aria-hidden className="anim-flutuar absolute -top-6 right-2 select-none text-[150px] leading-none opacity-25 sm:text-[200px]">
            {esp.emoji}
          </span>
          <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative hidden flex-none sm:block">
                <span aria-hidden className="anel-logo absolute -inset-1 rounded-full" />
                <Image src="/logo-comissao.png" alt="" width={76} height={76} className="relative h-[76px] w-[76px] rounded-full bg-white object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusCampeonato status={cup.status} aoVivo={aoVivo} />
                  <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                    {esp.emoji} {esp.nome} · {FORMATOS[cup.format as Formato]?.curto}
                  </span>
                </div>
                <h1 className="mt-2 font-placar text-4xl font-extrabold uppercase leading-none tracking-wide drop-shadow sm:text-5xl">{cup.name}</h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1.5"><Users size={15} /> {cup.teams.length} equipes</span>
                  {cup.startDate && <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} /> {fmtDataHora(cup.startDate)}</span>}
                  {cup.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {cup.location}</span>}
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 lg:w-80">
              {painel.progresso.total > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-white/85">
                    <span>{painel.progresso.feitos} de {painel.progresso.total} jogos</span>
                    <span className="font-placar text-base">{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="barra-enquete barra-listrada h-full rounded-full bg-gradient-to-r from-unifique-teal via-unifique-green to-unifique-yellow" style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {cup.status === "andamento" && <AutoRefresh segundos={aoVivo ? 15 : 45} aoVivo={aoVivo} />}
                <Link
                  href={`${base}/telao`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
                >
                  <MonitorPlay size={13} /> Modo telão
                </Link>
                {user && (
                  <Link href={`/admin/campeonatos/${cup.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-unifique shadow">
                    <Settings size={13} /> Gerenciar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {painel.podio.campeao && (
          <Campeao cupId={cup.id} campeao={t(painel.podio.campeao)} vice={t(painel.podio.vice)} terceiro={t(painel.podio.terceiro)} />
        )}

        {/* Abas (grudam no topo ao rolar) */}
        <nav className="rolagem-suave sticky top-[66px] z-20 -mx-3 overflow-x-auto px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f0f4fb]/80 dark:supports-[backdrop-filter]:bg-[#0b0f1a]/80">
          <div className="flex w-max gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
            {abas.map((a) => (
              <Link
                key={a.id}
                href={`${base}?aba=${a.id}`}
                scroll={false}
                className={`whitespace-nowrap rounded-xl px-4 py-2 font-placar text-base font-semibold uppercase tracking-wide transition ${
                  aba === a.id
                    ? "bg-unifique text-white shadow"
                    : "text-gray-500 hover:bg-unifique-light hover:text-unifique dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {a.rotulo}
                {a.id === "jogos" && aoVivo && <span className="ao-vivo-ponto ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" />}
              </Link>
            ))}
          </div>
        </nav>

        <div key={aba} className="fade-in-up">
          {/* ===== VISÃO GERAL ===== */}
          {aba === "geral" && (
            <div className="space-y-5">
              {aoVivo && (
                <section className="space-y-2">
                  <h2 className="flex items-center gap-2 font-placar text-xl font-bold uppercase text-red-500">
                    <span className="ao-vivo-ponto h-2.5 w-2.5 rounded-full bg-red-500" /> Acontecendo agora
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {painel.aoVivo.map((j) => <JogoCard key={j.id} jogo={j} painel={painel} rotulo={rotuloDoJogo(j, painel)} />)}
                  </div>
                </section>
              )}

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
                {/* No celular a rodada vem primeiro */}
                <aside className="order-first space-y-5 xl:order-last">
                  <div className="xl:sticky xl:top-36">
                    <RodadaNav etapas={etapas} atual={atual} painel={painel} hrefEtapa={(e) => `${base}?aba=geral&rodada=${e}`} />
                  </div>
                </aside>
                <div className="min-w-0 space-y-5">
                  {temTabela && tabelas.length > 0 && blocoTabelas}
                  {temChave && (painel.jogosMata.length > 0 || cup.format === "mata") && (
                    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                      <h2 className="mb-3 font-placar text-lg font-bold uppercase tracking-wide text-unifique dark:text-unifique-teal">Chaveamento</h2>
                      <Chave painel={painel} />
                    </section>
                  )}
                  <Destaques painel={painel} base={base} />
                </div>
              </div>
            </div>
          )}

          {/* ===== JOGOS ===== */}
          {aba === "jogos" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-80">
                  <TimeFiltro times={cup.teams.map((x) => ({ id: x.id, name: x.name }))} atual={timeFiltro} base={`${base}?aba=jogos`} />
                </div>
                <p className="text-sm text-gray-500">
                  {painel.progresso.feitos} de {painel.progresso.total} jogos disputados
                </p>
              </div>

              {timeFiltro ? (
                <JogosDoTime painel={painel} timeId={timeFiltro} />
              ) : etapas.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm dark:bg-slate-800">A tabela de jogos ainda não foi gerada.</p>
              ) : (
                <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {etapas.map((e) => (
                    <section key={e.id} id={e.id} className="scroll-mt-36 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                      <h2 className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-slate-700">
                        <span className="font-placar text-lg font-bold uppercase tracking-wide text-unifique dark:text-unifique-teal">{e.titulo}</span>
                        <span className="text-xs font-medium text-gray-400">
                          {e.jogos.filter((j) => j.status === "encerrado").length}/{e.jogos.length}
                        </span>
                      </h2>
                      <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {e.jogos.map((j) => (
                          <JogoLinha key={j.id} jogo={j} painel={painel} rotulo={rotuloDoJogo(j, painel)} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CLASSIFICAÇÃO ===== */}
          {aba === "tabela" &&
            (tabelas.length > 0 ? (
              <div className={`grid gap-4 ${tabelas.length > 1 ? "lg:grid-cols-2" : ""}`}>
                {tabelas.map(([g, linhas]) => (
                  <Tabela
                    key={g}
                    linhas={linhas}
                    titulo={g ? `Grupo ${g}` : "Classificação"}
                    classificam={cup.format === "grupos" ? cup.qualifiers : 0}
                    placar={esp.placar}
                    hrefTime={hrefTime}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm dark:bg-slate-800">Os grupos ainda não foram sorteados.</p>
            ))}

          {/* ===== CHAVE ===== */}
          {aba === "chave" && (
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
              <Chave painel={painel} />
            </div>
          )}

          {aba === "stats" && <Estatisticas painel={painel} />}

          {/* ===== EQUIPES ===== */}
          {aba === "equipes" && (
            <div className="em-sequencia grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {cup.teams.map((time) => (
                <Link key={time.id} href={hrefTime(time.id)} className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800">
                  <div className="h-1.5" style={{ background: time.color }} />
                  <div className="flex items-center gap-3 p-4">
                    <Escudo time={time} size={44} />
                    <div className="min-w-0">
                      <p className="line-clamp-2 break-words leading-tight font-display font-bold text-gray-800 dark:text-slate-100">{time.name}</p>
                      <p className="text-xs text-gray-400">
                        {time.group ? `Grupo ${time.group}` : ""}
                        {time.seeded ? " · cabeça de chave" : ""}
                      </p>
                    </div>
                  </div>
                  {time.players && (
                    <ul className="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 py-3 dark:border-slate-700">
                      {time.players.split("\n").map((p) => (
                        <li key={p} className="rounded-full bg-unifique-light px-2.5 py-0.5 text-xs font-medium text-unifique dark:bg-slate-700 dark:text-slate-200">
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Mande o link para quem é da comissão 👇</p>
          <ShareLink path={base} message={`${esp.emoji} ${cup.name}:`} />
        </div>
      </div>
    </div>
  );
}

// Todos os jogos de um time + resumo da campanha.
function JogosDoTime({ painel, timeId }: { painel: Painel; timeId: string }) {
  const time = painel.times.get(timeId)!;
  const jogos = painel.cup.matches.filter((m) => (m.homeId === timeId || m.awayId === timeId) && m.status !== "folga");
  const linha = [...painel.tabelas.values()].flat().find((l) => l.time.id === timeId);
  const gols = painel.artilharia.filter((a) => a.teamId === timeId).slice(0, 3);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
        <div className="h-2" style={{ background: time.color }} />
        <div className="flex items-center gap-3 p-4">
          <Escudo time={time} size={52} />
          <div className="min-w-0">
            <p className="line-clamp-2 break-words leading-tight font-placar text-2xl font-bold uppercase">{time.name}</p>
            {time.group && <p className="text-xs text-gray-400">Grupo {time.group}</p>}
          </div>
        </div>
        {linha && (
          <div className="grid grid-cols-4 border-t border-gray-100 text-center dark:border-slate-700">
            {[
              [`${linha.pos}º`, "posição"],
              [linha.pts, "pontos"],
              [`${linha.v}-${linha.e}-${linha.d}`, "V-E-D"],
              [linha.sg > 0 ? `+${linha.sg}` : linha.sg, "saldo"],
            ].map(([v, r]) => (
              <div key={String(r)} className="py-3">
                <p className="font-placar text-2xl font-bold text-unifique dark:text-unifique-teal">{v}</p>
                <p className="text-[10px] font-semibold uppercase text-gray-400">{r}</p>
              </div>
            ))}
          </div>
        )}
        {gols.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 text-sm dark:border-slate-700">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Artilheiros</p>
            {gols.map((g) => (
              <p key={g.player} className="flex justify-between">
                <span>{g.player}</span>
                <b className="font-placar text-base">{g.gols}</b>
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-slate-700 dark:bg-slate-800">
        {jogos.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Nenhum jogo ainda.</p>}
        {jogos.map((j) => (
          <JogoLinha key={j.id} jogo={j} painel={painel} rotulo={rotuloDoJogo(j, painel)} destaqueTime={timeId} />
        ))}
      </div>
    </div>
  );
}

// Mini cards na visão geral: artilheiro, melhor ataque, defesa.
function Destaques({ painel, base }: { painel: Painel; base: string }) {
  const linhas = [...painel.tabelas.values()].flat();
  const cards: { titulo: string; nome: string; valor: string | number; cor?: string }[] = [];
  const art = painel.artilharia[0];
  if (art) cards.push({ titulo: painel.esp.placar === "gols" ? "Artilheiro" : "Destaque", nome: art.player, valor: art.gols });
  if (linhas.some((l) => l.j > 0)) {
    const ataque = [...linhas].sort((a, b) => b.gp - a.gp)[0];
    const defesa = [...linhas].filter((l) => l.j > 0).sort((a, b) => a.gc / a.j - b.gc / b.j)[0];
    cards.push({ titulo: "Melhor ataque", nome: ataque.time.name, valor: ataque.gp, cor: ataque.time.color });
    if (defesa) cards.push({ titulo: "Melhor defesa", nome: defesa.time.name, valor: defesa.gc, cor: defesa.time.color });
  }
  const craque = painel.destaques[0];
  if (craque) cards.push({ titulo: "Mais vezes craque", nome: craque.player, valor: craque.vezes });
  if (cards.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-placar text-lg font-bold uppercase tracking-wide text-unifique dark:text-unifique-teal">Destaques</h2>
        <Link href={`${base}?aba=stats`} className="text-xs font-semibold text-unifique-blue hover:underline">Ver estatísticas</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.titulo} className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: c.cor ?? "#00A2FF" }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.titulo}</p>
            <p className="mt-1 line-clamp-2 break-words leading-tight font-semibold text-gray-800 dark:text-slate-100">{c.nome}</p>
            <p className="font-placar text-3xl font-bold text-unifique dark:text-unifique-teal">{c.valor}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Estatisticas({ painel }: { painel: Painel }) {
  const { esp } = painel;
  const nomeTime = (id: string | null) => (id ? painel.times.get(id) : null);
  const vazio = painel.artilharia.length === 0 && painel.cartoes.length === 0 && painel.destaques.length === 0;
  const encerrados = painel.cup.matches.filter((m) => m.status === "encerrado" && m.homeScore != null);
  const totalPlacar = encerrados.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const media = encerrados.length ? (totalPlacar / encerrados.length).toFixed(1) : "0";
  const maiorGoleada = [...encerrados].sort(
    (a, b) => Math.abs((b.homeScore ?? 0) - (b.awayScore ?? 0)) - Math.abs((a.homeScore ?? 0) - (a.awayScore ?? 0)),
  )[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { v: painel.progresso.feitos, r: "jogos disputados" },
          { v: totalPlacar, r: `${esp.rotuloPlacar.toLowerCase()} no total` },
          { v: media, r: "média por jogo" },
          { v: painel.cup.teams.length, r: "equipes" },
        ].map((n) => (
          <div key={n.r} className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <p className="font-placar text-4xl font-bold text-unifique dark:text-unifique-teal">{n.v}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{n.r}</p>
          </div>
        ))}
      </div>

      {maiorGoleada && Math.abs((maiorGoleada.homeScore ?? 0) - (maiorGoleada.awayScore ?? 0)) > 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
          🔥 Maior placar elástico: <b>{nomeTime(maiorGoleada.homeId)?.name}</b> {maiorGoleada.homeScore} × {maiorGoleada.awayScore}{" "}
          <b>{nomeTime(maiorGoleada.awayId)?.name}</b>
        </p>
      )}

      {vazio && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:bg-slate-800">
          Quando a comissão lançar {esp.rotuloLance ? `${esp.rotuloLance.toLowerCase()}s, cartões` : "os destaques"} pela súmula, o ranking aparece aqui.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {painel.artilharia.length > 0 && (
          <Ranking
            titulo={esp.placar === "gols" ? "Artilharia" : `Ranking de ${esp.rotuloLance?.toLowerCase() ?? "pontos"}`}
            icone={esp.placar === "gols" ? "⚽" : esp.emoji}
            itens={painel.artilharia.map((a) => ({ nome: a.player, time: nomeTime(a.teamId), valor: a.gols }))}
          />
        )}
        {painel.destaques.length > 0 && (
          <Ranking titulo="Craque do jogo" icone="⭐" itens={painel.destaques.map((d) => ({ nome: d.player, time: nomeTime(d.teamId), valor: d.vezes }))} />
        )}
        {painel.cartoes.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            <h3 className="border-b border-gray-100 px-4 py-3 font-placar text-lg font-bold uppercase text-unifique dark:border-slate-700 dark:text-unifique-teal">Cartões</h3>
            <ul className="divide-y divide-gray-50 dark:divide-slate-700">
              {painel.cartoes.map((c) => (
                <li key={`${c.player}-${c.teamId}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Escudo time={nomeTime(c.teamId)} size={24} />
                  <span className="min-w-0 flex-1 truncate font-medium">{c.player}</span>
                  {c.amarelo > 0 && <span className="rounded bg-yellow-400 px-1.5 text-xs font-bold text-yellow-900">{c.amarelo}</span>}
                  {c.vermelho > 0 && <span className="rounded bg-red-500 px-1.5 text-xs font-bold text-white">{c.vermelho}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Ranking({
  titulo,
  icone,
  itens,
}: {
  titulo: string;
  icone: string;
  itens: { nome: string; time: { name: string; color: string } | null | undefined; valor: number }[];
}) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      <h3 className="border-b border-gray-100 px-4 py-3 font-placar text-lg font-bold uppercase text-unifique dark:border-slate-700 dark:text-unifique-teal">
        {icone} {titulo}
      </h3>
      <ol className="divide-y divide-gray-50 dark:divide-slate-700">
        {itens.slice(0, 15).map((i, k) => (
          <li key={`${i.nome}-${k}`} className="relative flex items-center gap-3 px-4 py-2.5 text-sm">
            <span aria-hidden className="barra-enquete absolute inset-y-1 left-0 rounded-r-full bg-unifique-teal/10" style={{ width: `${(i.valor / max) * 100}%` }} />
            <span className={`relative w-6 text-center font-placar text-lg font-bold ${k === 0 ? "text-amber-500" : "text-gray-400"}`}>{k + 1}</span>
            <Escudo time={i.time} size={24} />
            <span className="relative min-w-0 flex-1">
              <span className="block line-clamp-2 break-words leading-tight font-semibold text-gray-800 dark:text-slate-100">{i.nome}</span>
              <span className="block truncate text-xs text-gray-400">{i.time?.name}</span>
            </span>
            <span className="relative font-placar text-2xl font-bold text-unifique dark:text-unifique-teal">{i.valor}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
