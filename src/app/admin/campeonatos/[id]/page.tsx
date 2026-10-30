import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, RotateCcw, Shuffle, Swords, Trash2, Trophy } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { buscarCampeonato, montarPainel, type JogoCompleto, type Painel } from "@/lib/campeonato/dados";
import { ESPORTES, FORMATOS, CORES_TIMES, type Formato } from "@/lib/campeonato/esportes";
import { LETRAS, nomeFase } from "@/lib/campeonato/motor";
import {
  addTeams,
  deleteCup,
  deleteTeam,
  gerarMataMata,
  gerarTabela,
  resetTabela,
  updateCup,
  updateTeam,
} from "@/lib/campeonato-actions";
import { toInputLocal } from "@/lib/datas";
import AdminJogo from "@/components/campeonato/AdminJogo";
import AutoRefresh from "@/components/campeonato/AutoRefresh";
import Tabela from "@/components/campeonato/Tabela";
import ConfirmButton from "@/components/ConfirmButton";
import SubmitButton from "@/components/form/SubmitButton";
import ShareLink from "@/components/ShareLink";
import { Escudo, StatusCampeonato } from "@/components/campeonato/ui";

export const dynamic = "force-dynamic";

const MENSAGENS: Record<string, [string, "ok" | "erro"]> = {
  criado: ["Campeonato criado! 🎉", "ok"],
  tabela: ["Tabela gerada. Bora jogar!", "ok"],
  mata: ["Mata-mata montado com os classificados.", "ok"],
  equipes: ["Equipes adicionadas.", "ok"],
  equipe: ["Equipe atualizada.", "ok"],
  salvo: ["Ajustes salvos.", "ok"],
  zerado: ["Tabela apagada. Ajuste as equipes e gere de novo.", "ok"],
  "poucos-times": ["Cadastre pelo menos 2 equipes.", "erro"],
  "com-tabela": ["Com a tabela gerada não dá para excluir equipes. Apague a tabela primeiro.", "erro"],
  "grupos-abertos": ["Ainda há jogos da fase de grupos sem resultado.", "erro"],
  "poucos-classificados": ["Não há classificados suficientes para o mata-mata.", "erro"],
  "sem-placar": ["Preencha o placar dos dois lados para encerrar.", "erro"],
  "empate-mata": ["No mata-mata precisa ter vencedor: informe os pênaltis.", "erro"],
  "sem-empate": ["Neste esporte não existe empate.", "erro"],
  lance: ["Informe o atleta do lance.", "erro"],
};

function rotuloJogo(j: JogoCompleto, painel: Painel): string {
  if (j.stage === "terceiro") return "Disputa de 3º lugar";
  if (j.stage === "mata") return nomeFase(painel.jogosMata.filter((m) => m.round === j.round).length);
  return `${j.group ? `Grupo ${j.group} · ` : ""}${j.round}ª rodada`;
}

const input = "mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900";

export default async function AdminCampeonatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; ok?: string; erro?: string; fase?: string }>;
}) {
  await requireUserPage();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const cup = await buscarCampeonato(id);
  if (!cup) notFound();
  const painel = montarPainel(cup);
  const { esp } = painel;
  const temJogos = cup.matches.length > 0;
  const aba = ["jogos", "equipes", "ajustes"].includes(sp.aba ?? "") ? sp.aba! : temJogos ? "jogos" : "equipes";
  const msg = MENSAGENS[sp.ok ?? ""] ?? MENSAGENS[sp.erro ?? ""];
  const publico = `/campeonatos/${cup.slug ?? cup.id}`;

  // Filtro de fase na aba de jogos
  const reais = cup.matches;
  const fases: { id: string; rotulo: string; jogos: JogoCompleto[] }[] = [];
  if (painel.aoVivo.length) fases.push({ id: "vivo", rotulo: "🔴 Ao vivo", jogos: painel.aoVivo });
  const pendentes = reais.filter((m) => m.status === "agendado" && m.homeId && m.awayId);
  if (pendentes.length) fases.push({ id: "pendentes", rotulo: "A jogar", jogos: pendentes });
  const rodadas = [...new Set(painel.jogosGrupo.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rodadas) fases.push({ id: `r${r}`, rotulo: `${r}ª rodada`, jogos: painel.jogosGrupo.filter((m) => m.round === r) });
  const rodadasMata = [...new Set(painel.jogosMata.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rodadasMata) {
    const lista = painel.jogosMata.filter((m) => m.round === r);
    const extra = r === rodadasMata[rodadasMata.length - 1] && painel.terceiro ? [painel.terceiro] : [];
    fases.push({ id: `m${r}`, rotulo: nomeFase(lista.length), jogos: [...extra, ...lista] });
  }
  if (temJogos) fases.push({ id: "todos", rotulo: "Todos", jogos: reais });
  const faseAtual = fases.find((f) => f.id === sp.fase) ?? fases[0];

  const grupoPendente = painel.jogosGrupo.filter((m) => m.status !== "encerrado").length;

  return (
    <div className="space-y-6">
      <Link href="/admin/campeonatos" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
        <ChevronLeft size={16} /> Campeonatos
      </Link>

      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${esp.gradiente} p-6 text-white shadow-lg`}>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-unifique-dark/85 to-unifique-dark/20" />
        <span aria-hidden className="absolute -right-4 -top-6 select-none text-[140px] leading-none opacity-20">{esp.emoji}</span>
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusCampeonato status={cup.status} aoVivo={painel.aoVivo.length > 0} />
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {esp.nome} · {FORMATOS[cup.format as Formato]?.nome}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold">{cup.name}</h1>
          <p className="text-sm text-white/85">
            {cup.teams.length} equipes · {painel.progresso.feitos}/{painel.progresso.total} jogos
            {painel.podio.campeao && ` · 🏆 ${painel.times.get(painel.podio.campeao)?.name}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link href={publico} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-unifique shadow">
              <ExternalLink size={15} /> Página pública
            </Link>
            {painel.aoVivo.length > 0 && <AutoRefresh segundos={30} aoVivo />}
          </div>
        </div>
      </section>

      {msg && (
        <p
          className={`aviso-entrar rounded-xl px-4 py-3 text-sm font-medium ${
            msg[1] === "ok" ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {msg[0]}
        </p>
      )}

      {/* Abas */}
      <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-slate-800">
        {[
          ["jogos", "Jogos"],
          ["equipes", `Equipes (${cup.teams.length})`],
          ["ajustes", "Ajustes"],
        ].map(([k, r]) => (
          <Link
            key={k}
            href={`/admin/campeonatos/${cup.id}?aba=${k}`}
            className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${
              aba === k ? "bg-unifique text-white shadow" : "text-gray-500 hover:bg-unifique-light dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      {/* ===== JOGOS ===== */}
      {aba === "jogos" && (
        <div className="space-y-5">
          {!temJogos && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800">
              <Swords size={32} className="mx-auto text-gray-300" />
              <p className="mt-2 font-display font-semibold">A tabela ainda não foi gerada</p>
              <p className="text-sm text-gray-500">Confira as equipes e clique em gerar.</p>
              <Link href={`/admin/campeonatos/${cup.id}?aba=equipes`} className="mt-4 inline-block rounded-xl bg-unifique px-4 py-2 text-sm font-semibold text-white">
                Ir para equipes
              </Link>
            </div>
          )}

          {cup.format === "grupos" && temJogos && painel.jogosMata.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-unifique-light to-white p-4 shadow-sm dark:from-slate-800 dark:to-slate-800">
              <div className="text-sm">
                <p className="font-display font-bold text-unifique dark:text-unifique-teal">Mata-mata</p>
                <p className="text-gray-500">
                  {grupoPendente > 0
                    ? `Faltam ${grupoPendente} jogo(s) da fase de grupos.`
                    : `Fase de grupos concluída! Os ${cup.qualifiers} melhores de cada grupo avançam.`}
                </p>
              </div>
              <form action={gerarMataMata}>
                <input type="hidden" name="cupId" value={cup.id} />
                {grupoPendente > 0 && <input type="hidden" name="forcar" value="1" />}
                {grupoPendente > 0 ? (
                  <ConfirmButton
                    message="Ainda há jogos de grupo sem resultado. Montar a chave mesmo assim com a classificação atual?"
                    className="inline-flex items-center gap-2 rounded-xl border border-unifique px-4 py-2 text-sm font-semibold text-unifique"
                  >
                    <Trophy size={16} /> Montar chave agora
                  </ConfirmButton>
                ) : (
                  <SubmitButton pendingText="Montando..." className="btn-brilho inline-flex items-center gap-2 rounded-xl bg-unifique px-4 py-2 text-sm font-bold text-white shadow">
                    <Trophy size={16} /> Gerar mata-mata
                  </SubmitButton>
                )}
              </form>
            </div>
          )}

          {fases.length > 0 && (
            <div className="rolagem-suave -mx-4 overflow-x-auto px-4">
              <div className="flex w-max gap-1.5">
                {fases.map((f) => (
                  <Link
                    key={f.id}
                    href={`/admin/campeonatos/${cup.id}?aba=jogos&fase=${f.id}`}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      faseAtual?.id === f.id
                        ? "bg-unifique text-white shadow"
                        : "bg-white text-gray-500 shadow-sm hover:text-unifique dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {f.rotulo} <span className="opacity-60">{f.jogos.filter((j) => j.status !== "folga").length}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {faseAtual && (
            <div className="grid gap-3 lg:grid-cols-2">
              {faseAtual.jogos.map((j) => (
                <AdminJogo
                  key={j.id}
                  jogo={j}
                  painel={painel}
                  rotulo={rotuloJogo(j, painel)}
                  voltar={`/admin/campeonatos/${cup.id}?aba=jogos&fase=${faseAtual.id}`}
                />
              ))}
            </div>
          )}

          {painel.tabelas.size > 0 && (
            <details className="rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              <summary className="cursor-pointer px-4 py-3 font-display font-semibold text-unifique dark:text-unifique-teal">
                Ver classificação
              </summary>
              <div className="grid gap-4 p-4 pt-0 lg:grid-cols-2">
                {[...painel.tabelas.entries()].map(([g, linhas]) => (
                  <Tabela key={g} linhas={linhas} titulo={g ? `Grupo ${g}` : undefined} classificam={cup.format === "grupos" ? cup.qualifiers : 0} placar={esp.placar} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ===== EQUIPES ===== */}
      {aba === "equipes" && (
        <div className="space-y-5">
          {!temJogos ? (
            <div className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-5 text-white shadow-lg">
              <p className="font-display text-lg font-bold">Tudo pronto?</p>
              <p className="text-sm text-white/85">
                {cup.format === "grupos"
                  ? `Os times serão divididos em ${Math.min(cup.groupsCount, Math.floor(cup.teams.length / 2)) || 1} grupo(s). Cabeças de chave ficam em grupos diferentes.`
                  : cup.format === "mata"
                    ? "Cabeças de chave ficam em lados opostos da chave; o resto é sorteado."
                    : "Todos contra todos, com a ordem das rodadas sorteada."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={gerarTabela}>
                  <input type="hidden" name="cupId" value={cup.id} />
                  <SubmitButton pendingText="Sorteando..." className="btn-brilho inline-flex items-center gap-2 rounded-xl bg-unifique-yellow px-5 py-2.5 font-display font-bold text-unifique-dark shadow">
                    <Shuffle size={18} /> Sortear e gerar tabela
                  </SubmitButton>
                </form>
                {cup.format === "grupos" && cup.teams.some((t) => t.group) && (
                  <form action={gerarTabela}>
                    <input type="hidden" name="cupId" value={cup.id} />
                    <input type="hidden" name="modo" value="manual" />
                    <SubmitButton pendingText="Gerando..." className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 font-semibold text-white">
                      Usar os grupos que eu defini
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <p>A tabela já foi gerada. Para trocar equipes ou grupos, apague a tabela e gere de novo.</p>
              <form action={resetTabela}>
                <input type="hidden" name="cupId" value={cup.id} />
                <ConfirmButton
                  message="Apagar TODOS os jogos e resultados deste campeonato? As equipes continuam."
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 px-3 py-1.5 font-semibold"
                >
                  <RotateCcw size={15} /> Apagar tabela
                </ConfirmButton>
              </form>
            </div>
          )}

          <form action={addTeams} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:flex-row sm:items-end">
            <input type="hidden" name="cupId" value={cup.id} />
            <label className="block flex-1">
              <span className="text-sm font-semibold">Adicionar equipes (uma por linha)</span>
              <textarea name="names" rows={2} required placeholder={"Equipe 1\nEquipe 2"} className={input} />
            </label>
            <SubmitButton pendingText="Adicionando..." className="rounded-xl bg-unifique px-4 py-2.5 text-sm font-bold text-white">
              Adicionar
            </SubmitButton>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {cup.teams.map((t) => (
              <details key={t.id} className="details-suave group rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                  <Escudo time={t} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-semibold">{t.name}</span>
                    <span className="block text-xs text-gray-400">
                      {t.group ? `Grupo ${t.group}` : "Sem grupo"}
                      {t.seeded && " · ⭐ cabeça de chave"}
                      {t.players && ` · ${t.players.split("\n").length} atleta(s)`}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-unifique-blue group-open:hidden">Editar</span>
                </summary>
                <form action={updateTeam} className="space-y-3 border-t border-gray-100 p-3 dark:border-slate-700">
                  <input type="hidden" name="id" value={t.id} />
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <label className="block">
                      <span className="text-xs text-gray-500">Nome</span>
                      <input name="name" defaultValue={t.name} maxLength={60} className={input} />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500">Cor</span>
                      <input type="color" name="color" defaultValue={t.color} list={`cores-${t.id}`} className="mt-1 block h-[38px] w-14 cursor-pointer rounded-xl border border-gray-300 bg-white p-1 dark:border-slate-600" />
                      <datalist id={`cores-${t.id}`}>
                        {CORES_TIMES.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cup.format === "grupos" && !temJogos && (
                      <label className="block">
                        <span className="text-xs text-gray-500">Grupo</span>
                        <select name="group" defaultValue={t.group ?? ""} className={input}>
                          <option value="">Sortear</option>
                          {LETRAS.slice(0, cup.groupsCount).map((l) => <option key={l} value={l}>Grupo {l}</option>)}
                        </select>
                      </label>
                    )}
                    <label className="flex items-center gap-2 pt-5 text-sm">
                      <input type="checkbox" name="seeded" defaultChecked={t.seeded} className="h-4 w-4 accent-unifique" />
                      Cabeça de chave
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs text-gray-500">Atletas (um por linha — aparecem na hora de lançar gols)</span>
                    <textarea name="players" rows={4} defaultValue={t.players ?? ""} className={input} />
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <SubmitButton pendingText="Salvando..." className="rounded-xl bg-unifique px-4 py-2 text-sm font-bold text-white">Salvar</SubmitButton>
                  </div>
                </form>
                {!temJogos && (
                  <form action={deleteTeam} className="px-3 pb-3">
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton message={`Excluir ${t.name}?`} className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                      <Trash2 size={13} /> Excluir equipe
                    </ConfirmButton>
                  </form>
                )}
              </details>
            ))}
          </div>
        </div>
      )}

      {/* ===== AJUSTES ===== */}
      {aba === "ajustes" && (
        <div className="space-y-5">
          <form action={updateCup} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <input type="hidden" name="id" value={cup.id} />
            <label className="block">
              <span className="text-sm font-semibold">Nome</span>
              <input name="name" defaultValue={cup.name} maxLength={80} className={input} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Início</span>
                <input type="datetime-local" name="startDate" defaultValue={toInputLocal(cup.startDate)} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Local</span>
                <input name="location" defaultValue={cup.location ?? ""} className={input} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Descrição</span>
              <textarea name="description" rows={3} defaultValue={cup.description ?? ""} className={input} />
            </label>

            {!temJogos && (
              <div className="grid gap-3 rounded-xl bg-unifique-light/50 p-4 dark:bg-slate-700/40 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold">Esporte</span>
                  <select name="sport" defaultValue={cup.sport} className={input}>
                    {ESPORTES.map((e) => <option key={e.id} value={e.id}>{e.emoji} {e.nome}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Formato</span>
                  <select name="format" defaultValue={cup.format} className={input}>
                    {(Object.keys(FORMATOS) as Formato[]).map((f) => <option key={f} value={f}>{FORMATOS[f].nome}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Grupos</span>
                  <input type="number" name="groupsCount" min={1} max={16} defaultValue={cup.groupsCount} className={input} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Classificam por grupo</span>
                  <input type="number" name="qualifiers" min={1} max={8} defaultValue={cup.qualifiers} className={input} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="doubleRound" defaultChecked={cup.doubleRound} className="h-4 w-4 accent-unifique" /> Turno e returno
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="thirdPlace" defaultChecked={cup.thirdPlace} className="h-4 w-4 accent-unifique" /> Disputa de 3º lugar
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Pontos vitória</span>
                <input type="number" name="pointsWin" min={0} max={9} defaultValue={cup.pointsWin} className={input} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Pontos empate</span>
                <input type="number" name="pointsDraw" min={0} max={9} defaultValue={cup.pointsDraw} className={input} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Pontos derrota</span>
                <input type="number" name="pointsLoss" min={0} max={9} defaultValue={cup.pointsLoss} className={input} />
              </label>
              {esp.placar === "sets" && (
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500">Jogos</span>
                  <select name="setsToWin" defaultValue={cup.setsToWin} className={input}>
                    <option value={1}>Jogo único</option>
                    <option value={2}>Melhor de 3</option>
                    <option value={3}>Melhor de 5</option>
                  </select>
                </label>
              )}
            </div>
            <SubmitButton pendingText="Salvando..." className="rounded-xl bg-unifique px-5 py-2.5 font-display font-semibold text-white">
              Salvar ajustes
            </SubmitButton>
          </form>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            <p className="mb-2 text-sm font-semibold">Compartilhar</p>
            <ShareLink path={publico} message={`${esp.emoji} Acompanhe o ${cup.name}:`} />
          </div>

          <div className="flex flex-wrap gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-500/30 dark:bg-red-500/5">
            {temJogos && (
              <form action={resetTabela}>
                <input type="hidden" name="cupId" value={cup.id} />
                <ConfirmButton message="Apagar todos os jogos e resultados?" className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600">
                  <RotateCcw size={15} /> Apagar tabela
                </ConfirmButton>
              </form>
            )}
            <form action={deleteCup}>
              <input type="hidden" name="id" value={cup.id} />
              <ConfirmButton message={`Excluir o campeonato "${cup.name}" com tudo dentro? Não dá para desfazer.`} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">
                <Trash2 size={15} /> Excluir campeonato
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
