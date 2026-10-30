import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, ChevronLeft, MapPin, Settings, Users } from "lucide-react";
import { buscarCampeonato, montarPainel, tabelaNaoExiste, type JogoCompleto, type Painel } from "@/lib/campeonato/dados";
import { FORMATOS, type Formato } from "@/lib/campeonato/esportes";
import { nomeFase } from "@/lib/campeonato/motor";
import { requireUserPage } from "@/lib/auth";
import { fmtDataHora } from "@/lib/datas";
import AutoRefresh from "@/components/campeonato/AutoRefresh";
import Campeao from "@/components/campeonato/Campeao";
import Chave from "@/components/campeonato/Chave";
import JogoCard from "@/components/campeonato/JogoCard";
import Tabela from "@/components/campeonato/Tabela";
import { Escudo, StatusCampeonato } from "@/components/campeonato/ui";
import ShareLink from "@/components/ShareLink";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ aba?: string }> };

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
  if (!cup) return { title: "Campeonato" };
  return { title: cup.name, description: `Tabela, jogos e classificação do ${cup.name}.` };
}

// Rótulo de cada jogo ("Grupo A · 2ª rodada", "Semifinal"...).
function rotuloJogo(j: JogoCompleto, painel: Painel): string {
  if (j.stage === "terceiro") return "Disputa de 3º lugar";
  if (j.stage === "mata") {
    const qtd = painel.jogosMata.filter((m) => m.round === j.round).length;
    return nomeFase(qtd);
  }
  return `${j.group ? `Grupo ${j.group} · ` : ""}${j.round}ª rodada`;
}

export default async function CampeonatoPage({ params, searchParams }: Params) {
  const [{ id }, { aba: abaRaw }, user] = await Promise.all([params, searchParams, requireUserPage()]);
  const cup = await carregar(id);
  if (!cup || (cup.status === "rascunho" && !user)) notFound();
  const painel = montarPainel(cup);
  const { esp } = painel;

  const temTabela = cup.format !== "mata";
  const temChave = cup.format !== "liga";
  const abas = [
    { id: "jogos", rotulo: "Jogos" },
    ...(temTabela ? [{ id: "tabela", rotulo: "Classificação" }] : []),
    ...(temChave ? [{ id: "chave", rotulo: "Chaveamento" }] : []),
    { id: "stats", rotulo: "Estatísticas" },
    { id: "equipes", rotulo: "Equipes" },
  ];
  const aba = abas.some((a) => a.id === abaRaw) ? abaRaw! : "jogos";
  const base = `/campeonatos/${cup.slug ?? cup.id}`;
  const pct = painel.progresso.total ? Math.round((painel.progresso.feitos / painel.progresso.total) * 100) : 0;
  const t = (tid: string | null) => (tid ? painel.times.get(tid) ?? null : null);

  // Jogos agrupados: ao vivo no topo, depois por rodada/fase.
  const blocos: { titulo: string; jogos: JogoCompleto[] }[] = [];
  const reais = cup.matches.filter((m) => m.status !== "folga");
  const grupo = reais.filter((m) => m.stage === "grupo");
  const rodadas = [...new Set(grupo.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rodadas) blocos.push({ titulo: `${r}ª rodada`, jogos: grupo.filter((m) => m.round === r) });
  const fasesMata = [...new Set(painel.jogosMata.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of fasesMata) {
    const lista = reais.filter((m) => m.stage === "mata" && m.round === r);
    if (lista.length) blocos.push({ titulo: nomeFase(painel.jogosMata.filter((m) => m.round === r).length), jogos: lista });
  }
  if (painel.terceiro) blocos.splice(blocos.length - 1, 0, { titulo: "Disputa de 3º lugar", jogos: [painel.terceiro] });

  return (
    <div className="space-y-6">
      <Link href="/campeonatos" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
        <ChevronLeft size={16} /> Campeonatos
      </Link>

      {/* Banner */}
      <section className={`banner-vivo relative overflow-hidden rounded-3xl bg-gradient-to-br ${esp.gradiente} p-6 text-white shadow-lg sm:p-8`}>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-unifique-dark/80 via-unifique-dark/30 to-transparent" />
        <span aria-hidden className="anim-flutuar absolute -right-6 -top-8 select-none text-[170px] leading-none opacity-20 sm:text-[220px]">
          {esp.emoji}
        </span>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <StatusCampeonato status={cup.status} aoVivo={painel.aoVivo.length > 0} />
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {esp.emoji} {esp.nome}
            </span>
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {FORMATOS[cup.format as Formato]?.nome}
            </span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative hidden flex-none sm:block">
              <span aria-hidden className="anel-logo absolute -inset-1 rounded-full" />
              <Image src="/logo-comissao.png" alt="" width={72} height={72} className="relative h-[72px] w-[72px] rounded-full bg-white object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold leading-tight drop-shadow sm:text-4xl">{cup.name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5"><Users size={15} /> {cup.teams.length} equipes</span>
                {cup.startDate && <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} /> {fmtDataHora(cup.startDate)}</span>}
                {cup.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {cup.location}</span>}
              </div>
            </div>
          </div>

          {painel.progresso.total > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-white/85">
                <span>{painel.progresso.feitos} de {painel.progresso.total} jogos disputados</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="barra-enquete barra-listrada h-full rounded-full bg-gradient-to-r from-unifique-teal via-unifique-green to-unifique-yellow"
                  style={{ width: `${Math.max(pct, 3)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {cup.status === "andamento" && <AutoRefresh segundos={painel.aoVivo.length ? 15 : 45} aoVivo={painel.aoVivo.length > 0} />}
            {user && (
              <Link
                href={`/admin/campeonatos/${cup.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-unifique shadow transition hover:brightness-95"
              >
                <Settings size={13} /> Gerenciar
              </Link>
            )}
          </div>
        </div>
      </section>

      {painel.podio.campeao && (
        <Campeao
          cupId={cup.id}
          campeao={t(painel.podio.campeao)}
          vice={t(painel.podio.vice)}
          terceiro={t(painel.podio.terceiro)}
        />
      )}

      {cup.description && (
        <p className="whitespace-pre-line rounded-2xl bg-white p-5 text-sm text-gray-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
          {cup.description}
        </p>
      )}

      {/* Ao vivo sempre em destaque */}
      {painel.aoVivo.length > 0 && aba !== "jogos" && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-red-500">
            <span className="ao-vivo-ponto h-2.5 w-2.5 rounded-full bg-red-500" /> Acontecendo agora
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {painel.aoVivo.map((j) => <JogoCard key={j.id} jogo={j} painel={painel} rotulo={rotuloJogo(j, painel)} />)}
          </div>
        </section>
      )}

      {/* Abas */}
      <nav className="rolagem-suave sticky top-[66px] z-20 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f0f4fb]/70 dark:supports-[backdrop-filter]:bg-[#0b0f1a]/70">
        <div className="flex w-max gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
          {abas.map((a) => (
            <Link
              key={a.id}
              href={`${base}?aba=${a.id}`}
              scroll={false}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                aba === a.id
                  ? "bg-unifique text-white shadow"
                  : "text-gray-500 hover:bg-unifique-light hover:text-unifique dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {a.rotulo}
            </Link>
          ))}
        </div>
      </nav>

      <div key={aba} className="fade-in-up">
        {aba === "jogos" && (
          <div className="space-y-8">
            {cup.matches.length === 0 && (
              <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm dark:bg-slate-800">
                A tabela de jogos ainda não foi gerada.
              </p>
            )}
            {painel.aoVivo.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-red-500">
                  <span className="ao-vivo-ponto h-2.5 w-2.5 rounded-full bg-red-500" /> Ao vivo
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {painel.aoVivo.map((j) => <JogoCard key={j.id} jogo={j} painel={painel} rotulo={rotuloJogo(j, painel)} />)}
                </div>
              </section>
            )}
            {blocos.map((b) => (
              <section key={b.titulo} className="space-y-3">
                <h2 className="flex items-center gap-3 font-display text-lg font-bold text-unifique dark:text-unifique-teal">
                  {b.titulo}
                  <span className="h-px flex-1 bg-gradient-to-r from-unifique/30 to-transparent" />
                  <span className="text-xs font-semibold text-gray-400">
                    {b.jogos.filter((j) => j.status === "encerrado").length}/{b.jogos.length}
                  </span>
                </h2>
                <div className="em-sequencia grid gap-3 md:grid-cols-2">
                  {b.jogos.map((j) => <JogoCard key={j.id} jogo={j} painel={painel} rotulo={rotuloJogo(j, painel)} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {aba === "tabela" && (
          <div className={`grid gap-5 ${painel.tabelas.size > 1 ? "lg:grid-cols-2" : ""}`}>
            {[...painel.tabelas.entries()].map(([g, linhas]) => (
              <Tabela
                key={g}
                linhas={linhas}
                titulo={g ? `Grupo ${g}` : undefined}
                classificam={cup.format === "grupos" ? cup.qualifiers : 0}
                placar={esp.placar}
              />
            ))}
            {painel.tabelas.size === 0 && (
              <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm dark:bg-slate-800">
                Os grupos ainda não foram sorteados.
              </p>
            )}
          </div>
        )}

        {aba === "chave" && <Chave painel={painel} />}

        {aba === "stats" && <Estatisticas painel={painel} />}

        {aba === "equipes" && (
          <div className="em-sequencia grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cup.teams.map((time) => (
              <div key={time.id} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                <div className="h-1.5" style={{ background: time.color }} />
                <div className="flex items-center gap-3 p-4">
                  <Escudo time={time} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-gray-800 dark:text-slate-100">{time.name}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Chama a galera pra acompanhar 👇</p>
        <ShareLink path={base} message={`${esp.emoji} Acompanhe o ${cup.name} ao vivo:`} />
      </div>
    </div>
  );
}

function Estatisticas({ painel }: { painel: Painel }) {
  const { esp } = painel;
  const nomeTime = (id: string | null) => (id ? painel.times.get(id) : null);
  const vazio = painel.artilharia.length === 0 && painel.cartoes.length === 0 && painel.destaques.length === 0;

  // Números gerais do campeonato
  const encerrados = painel.cup.matches.filter((m) => m.status === "encerrado" && m.homeScore != null);
  const totalPlacar = encerrados.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const media = encerrados.length ? (totalPlacar / encerrados.length).toFixed(1) : "0";
  const maiorGoleada = [...encerrados].sort(
    (a, b) => Math.abs((b.homeScore ?? 0) - (b.awayScore ?? 0)) - Math.abs((a.homeScore ?? 0) - (a.awayScore ?? 0)),
  )[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: painel.progresso.feitos, r: "jogos disputados" },
          { v: totalPlacar, r: `${esp.rotuloPlacar.toLowerCase()} no total` },
          { v: media, r: `média por jogo` },
          { v: painel.cup.teams.length, r: "equipes" },
        ].map((n) => (
          <div key={n.r} className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <p className="font-display text-3xl font-extrabold text-unifique dark:text-unifique-teal">{n.v}</p>
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
          {esp.rotuloLance
            ? `Quando a comissão lançar ${esp.rotuloLance.toLowerCase()}s e destaques, o ranking aparece aqui.`
            : "Quando a comissão lançar os destaques dos jogos, o ranking aparece aqui."}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {painel.artilharia.length > 0 && (
          <Ranking
            titulo={esp.placar === "pontos" ? `Ranking de ${esp.rotuloLance?.toLowerCase() ?? "pontos"}` : "Artilharia"}
            icone={esp.emoji}
            itens={painel.artilharia.map((a) => ({ nome: a.player, time: nomeTime(a.teamId), valor: a.gols }))}
          />
        )}
        {painel.destaques.length > 0 && (
          <Ranking
            titulo="Craque do jogo"
            icone="⭐"
            itens={painel.destaques.map((d) => ({ nome: d.player, time: nomeTime(d.teamId), valor: d.vezes }))}
          />
        )}
        {painel.cartoes.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            <h3 className="border-b border-gray-100 px-4 py-3 font-display font-bold text-unifique dark:border-slate-700 dark:text-unifique-teal">
              Cartões
            </h3>
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
      <h3 className="border-b border-gray-100 px-4 py-3 font-display font-bold text-unifique dark:border-slate-700 dark:text-unifique-teal">
        {icone} {titulo}
      </h3>
      <ol className="divide-y divide-gray-50 dark:divide-slate-700">
        {itens.slice(0, 15).map((i, k) => (
          <li key={`${i.nome}-${k}`} className="relative flex items-center gap-3 px-4 py-2.5 text-sm">
            <span
              aria-hidden
              className="barra-enquete absolute inset-y-1 left-0 rounded-r-full bg-unifique-teal/10"
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
            <span className={`relative w-6 text-center font-display font-extrabold ${k === 0 ? "text-amber-500" : "text-gray-400"}`}>
              {k + 1}
            </span>
            <Escudo time={i.time} size={24} />
            <span className="relative min-w-0 flex-1">
              <span className="block truncate font-semibold text-gray-800 dark:text-slate-100">{i.nome}</span>
              <span className="block truncate text-xs text-gray-400">{i.time?.name}</span>
            </span>
            <span className="relative font-display text-lg font-extrabold text-unifique dark:text-unifique-teal">{i.valor}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
