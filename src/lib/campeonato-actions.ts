"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { parseDataLocal } from "./datas";
import { esporte, FORMATOS, CORES_TIMES } from "./campeonato/esportes";
import {
  evitarMesmoGrupo,
  LETRAS,
  montarChave,
  podio,
  propagarChave,
  rodizio,
  semeadosDosGrupos,
  setsDasParciais,
  sortearGrupos,
} from "./campeonato/motor";
import { buscarCampeonato, regrasDo, slugify, tabelasDo, timeLite } from "./campeonato/dados";

// ===================== utilidades =====================

const txt = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string, padrao: number, min = 0, max = 99) => {
  const n = parseInt(String(fd.get(k) ?? ""), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : padrao;
};
const intOuNull = (fd: FormData, k: string) => {
  const s = String(fd.get(k) ?? "").trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 999) : null;
};
const marcado = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";

function revalidar(slugOuId?: string | null) {
  revalidatePath("/campeonatos", "layout");
  revalidatePath("/admin/campeonatos", "layout");
  if (slugOuId) revalidatePath(`/campeonatos/${slugOuId}`);
}

function voltar(fd: FormData, padrao: string): never {
  const destino = String(fd.get("voltar") ?? "");
  redirect(/^\/(?![\/\\])/.test(destino) && !/[\r\n]/.test(destino) ? destino : padrao);
}

// Volta para a página de origem com um código de erro (?erro=...).
function voltarComErro(fd: FormData, padrao: string, codigo: string): never {
  const destino = String(fd.get("voltar") ?? "");
  const base = /^\/(?![\/\\])/.test(destino) && !/[\r\n]/.test(destino) ? destino : padrao;
  const [caminho, ancora] = base.split("#");
  redirect(`${caminho}${caminho.includes("?") ? "&" : "?"}erro=${codigo}${ancora ? `#${ancora}` : ""}`);
}

async function slugUnico(base: string, excluirId?: string): Promise<string> {
  let slug = base;
  for (let n = 2; ; n++) {
    const existe = await prisma.cup.findFirst({
      where: { slug, ...(excluirId ? { NOT: { id: excluirId } } : {}) },
      select: { id: true },
    });
    if (!existe) return slug;
    slug = `${base}-${n}`;
  }
}

function linhasDeTimes(raw: string): string[] {
  const vistos = new Set<string>();
  return raw
    .split(/\n|;/)
    .map((l) => l.replace(/^\s*\d+[.)-]\s*/, "").trim().slice(0, 60))
    .filter((l) => {
      const k = l.toLowerCase();
      if (!l || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 64);
}

// ===================== campeonato =====================

export async function createCup(fd: FormData) {
  await requireUser();
  const name = txt(fd, "name", 80);
  const sport = esporte(txt(fd, "sport", 30)).id;
  const formatRaw = txt(fd, "format", 10);
  const format = formatRaw in FORMATOS ? formatRaw : "grupos";
  if (!name) redirect("/admin/campeonatos/novo?erro=nome");

  const esp = esporte(sport);
  const nomesTimes = linhasDeTimes(String(fd.get("teams") ?? ""));
  const slug = await slugUnico(slugify(name));
  const startRaw = txt(fd, "startDate", 20);

  const cup = await prisma.cup.create({
    data: {
      name,
      slug,
      sport,
      format,
      description: txt(fd, "description", 2000) || null,
      location: txt(fd, "location", 120) || null,
      startDate: startRaw ? parseDataLocal(startRaw) : null,
      groupsCount: int(fd, "groupsCount", 2, 1, 16),
      qualifiers: int(fd, "qualifiers", 2, 1, 8),
      doubleRound: marcado(fd, "doubleRound"),
      thirdPlace: marcado(fd, "thirdPlace"),
      allowDraw: esp.empate,
      pointsWin: int(fd, "pointsWin", esp.pontos.v),
      pointsDraw: int(fd, "pointsDraw", esp.pontos.e),
      pointsLoss: int(fd, "pointsLoss", esp.pontos.d),
      setsToWin: int(fd, "setsToWin", esp.setsParaVencer ?? 2, 1, 7),
      teams: {
        create: nomesTimes.map((n, i) => ({ name: n, color: CORES_TIMES[i % CORES_TIMES.length] })),
      },
    },
    select: { id: true },
  });

  if (marcado(fd, "gerar") && nomesTimes.length >= 2) {
    const erro = await gerarTabelaInterno(cup.id, true);
    revalidar(slug);
    if (erro) redirect(`/admin/campeonatos/${cup.id}?aba=equipes&erro=${erro}`);
    redirect(`/admin/campeonatos/${cup.id}?aba=jogos&ok=criado`);
  }
  revalidar(slug);
  redirect(`/admin/campeonatos/${cup.id}?aba=equipes&ok=criado`);
}

export async function updateCup(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const cup = await prisma.cup.findUnique({ where: { id } });
  if (!cup) redirect("/admin/campeonatos");
  const name = txt(fd, "name", 80) || cup.name;
  const startRaw = txt(fd, "startDate", 20);
  const slug = name !== cup.name ? await slugUnico(slugify(name), id) : cup.slug;
  // Formato e esporte só mudam enquanto a tabela não foi gerada.
  const semJogos = (await prisma.cupMatch.count({ where: { cupId: id } })) === 0;
  const formatRaw = txt(fd, "format", 10);
  await prisma.cup.update({
    where: { id },
    data: {
      name,
      slug,
      description: txt(fd, "description", 2000) || null,
      location: txt(fd, "location", 120) || null,
      startDate: startRaw ? parseDataLocal(startRaw) : null,
      pointsWin: int(fd, "pointsWin", cup.pointsWin),
      pointsDraw: int(fd, "pointsDraw", cup.pointsDraw),
      pointsLoss: int(fd, "pointsLoss", cup.pointsLoss),
      setsToWin: int(fd, "setsToWin", cup.setsToWin, 1, 7),
      ...(semJogos
        ? {
            sport: esporte(txt(fd, "sport", 30) || cup.sport).id,
            format: formatRaw in FORMATOS ? formatRaw : cup.format,
            groupsCount: int(fd, "groupsCount", cup.groupsCount, 1, 16),
            qualifiers: int(fd, "qualifiers", cup.qualifiers, 1, 8),
            doubleRound: marcado(fd, "doubleRound"),
            thirdPlace: marcado(fd, "thirdPlace"),
          }
        : {}),
    },
  });
  revalidar(slug);
  redirect(`/admin/campeonatos/${id}?aba=ajustes&ok=salvo`);
}

export async function deleteCup(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  await prisma.cup.delete({ where: { id } }).catch(() => null);
  revalidar();
  redirect("/admin/campeonatos?ok=excluido");
}

// ===================== equipes =====================

export async function addTeams(fd: FormData) {
  await requireUser();
  const cupId = txt(fd, "cupId", 40);
  const nomes = linhasDeTimes(String(fd.get("names") ?? ""));
  const ja = await prisma.cupTeam.findMany({ where: { cupId }, select: { name: true } });
  const existentes = new Set(ja.map((t) => t.name.toLowerCase()));
  const novos = nomes.filter((n) => !existentes.has(n.toLowerCase()));
  await prisma.cupTeam.createMany({
    data: novos.map((name, i) => ({ cupId, name, color: CORES_TIMES[(ja.length + i) % CORES_TIMES.length] })),
  });
  revalidar();
  redirect(`/admin/campeonatos/${cupId}?aba=equipes&ok=equipes`);
}

export async function updateTeam(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const team = await prisma.cupTeam.findUnique({ where: { id } });
  if (!team) redirect("/admin/campeonatos");
  const color = txt(fd, "color", 9);
  const groupRaw = txt(fd, "group", 2).toUpperCase();
  await prisma.cupTeam.update({
    where: { id },
    data: {
      name: txt(fd, "name", 60) || team.name,
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : team.color,
      players: String(fd.get("players") ?? "").split("\n").map((l) => l.trim().slice(0, 60)).filter(Boolean).slice(0, 40).join("\n") || null,
      seeded: marcado(fd, "seeded"),
      ...(fd.has("group") ? { group: LETRAS.includes(groupRaw) ? groupRaw : null } : {}),
    },
  });
  revalidar();
  redirect(`/admin/campeonatos/${team.cupId}?aba=equipes&ok=equipe`);
}

export async function deleteTeam(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const team = await prisma.cupTeam.findUnique({ where: { id } });
  if (!team) redirect("/admin/campeonatos");
  const jogos = await prisma.cupMatch.count({ where: { cupId: team.cupId } });
  if (jogos > 0) redirect(`/admin/campeonatos/${team.cupId}?aba=equipes&erro=com-tabela`);
  await prisma.cupTeam.delete({ where: { id } });
  revalidar();
  redirect(`/admin/campeonatos/${team.cupId}?aba=equipes`);
}

// ===================== tabela / chaveamento =====================

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

// Gera todos os jogos conforme o formato. Devolve um código de erro ou null.
async function gerarTabelaInterno(cupId: string, sortear: boolean): Promise<string | null> {
  const cup = await prisma.cup.findUnique({ where: { id: cupId }, include: { teams: { orderBy: { createdAt: "asc" } } } });
  if (!cup) return "nao-encontrado";
  if (cup.teams.length < 2) return "poucos-times";

  const base = { cupId, location: cup.location, date: null as Date | null };
  type Novo = { stage: string; group: string | null; round: number; slot: number; homeId: string | null; awayId: string | null; status?: string };
  const novos: Novo[] = [];

  if (cup.format === "liga") {
    const ordem = embaralhar(cup.teams.map((t) => t.id));
    rodizio(ordem, cup.doubleRound).forEach((jogos, r) =>
      jogos.forEach(([h, a], s) => novos.push({ stage: "grupo", group: null, round: r + 1, slot: s, homeId: h, awayId: a })),
    );
  } else if (cup.format === "mata") {
    const cabecas = cup.teams.filter((t) => t.seeded).map((t) => t.id);
    const resto = embaralhar(cup.teams.filter((t) => !t.seeded).map((t) => t.id));
    const chave = montarChave([...cabecas, ...resto]);
    chave.forEach((j) => novos.push({ stage: "mata", group: null, ...j }));
    const fases = Math.max(...chave.map((j) => j.round));
    if (cup.thirdPlace && fases >= 2) {
      novos.push({ stage: "terceiro", group: null, round: fases, slot: 1, homeId: null, awayId: null });
    }
  } else {
    const nGrupos = Math.min(cup.groupsCount, Math.floor(cup.teams.length / 2)) || 1;
    const todosComGrupo = cup.teams.every((t) => t.group && LETRAS.indexOf(t.group) < nGrupos);
    const grupoDe = sortear || !todosComGrupo
      ? sortearGrupos(cup.teams.map(timeLite), nGrupos)
      : new Map(cup.teams.map((t) => [t.id, t.group!]));
    await prisma.$transaction(
      cup.teams.map((t) => prisma.cupTeam.update({ where: { id: t.id }, data: { group: grupoDe.get(t.id) ?? null } })),
    );
    const letras = [...new Set(grupoDe.values())].sort();
    for (const g of letras) {
      const ids = cup.teams.filter((t) => grupoDe.get(t.id) === g).map((t) => t.id);
      rodizio(ids, cup.doubleRound).forEach((jogos, r) =>
        jogos.forEach(([h, a], s) => novos.push({ stage: "grupo", group: g, round: r + 1, slot: s, homeId: h, awayId: a })),
      );
    }
  }

  await prisma.$transaction([
    prisma.cupMatch.deleteMany({ where: { cupId } }),
    prisma.cupMatch.createMany({ data: novos.map((n) => ({ ...base, ...n })) }),
    prisma.cup.update({ where: { id: cupId }, data: { status: "andamento" } }),
  ]);
  await recalcular(cupId);
  return null;
}

export async function gerarTabela(fd: FormData) {
  await requireUser();
  const cupId = txt(fd, "cupId", 40);
  const erro = await gerarTabelaInterno(cupId, fd.get("modo") !== "manual");
  revalidar();
  if (erro) redirect(`/admin/campeonatos/${cupId}?aba=equipes&erro=${erro}`);
  redirect(`/admin/campeonatos/${cupId}?aba=jogos&ok=tabela`);
}

export async function resetTabela(fd: FormData) {
  await requireUser();
  const cupId = txt(fd, "cupId", 40);
  await prisma.$transaction([
    prisma.cupMatch.deleteMany({ where: { cupId } }),
    prisma.cup.update({ where: { id: cupId }, data: { status: "rascunho" } }),
  ]);
  revalidar();
  redirect(`/admin/campeonatos/${cupId}?aba=equipes&ok=zerado`);
}

// Fase de grupos encerrada → monta a chave com os classificados.
export async function gerarMataMata(fd: FormData) {
  await requireUser();
  const cupId = txt(fd, "cupId", 40);
  const cup = await buscarCampeonato(cupId);
  if (!cup || cup.format !== "grupos") redirect("/admin/campeonatos");
  const grupoJogos = cup.matches.filter((m) => m.stage === "grupo");
  if (!fd.has("forcar") && grupoJogos.some((m) => m.status !== "encerrado")) {
    redirect(`/admin/campeonatos/${cupId}?aba=jogos&erro=grupos-abertos`);
  }
  const tabelas = tabelasDo(cup);
  const seeds = semeadosDosGrupos(tabelas, cup.qualifiers);
  if (seeds.length < 2) redirect(`/admin/campeonatos/${cupId}?aba=jogos&erro=poucos-classificados`);
  const grupoDe = new Map(cup.teams.map((t) => [t.id, t.group]));
  const chave = evitarMesmoGrupo(montarChave(seeds), (id) => grupoDe.get(id) ?? null);
  const fases = Math.max(...chave.map((j) => j.round));
  const novos = chave.map((j) => ({ cupId, stage: "mata", group: null, location: cup.location, ...j }));
  if (cup.thirdPlace && fases >= 2) {
    novos.push({ cupId, stage: "terceiro", group: null, location: cup.location, round: fases, slot: 1, homeId: null, awayId: null });
  }
  await prisma.$transaction([
    prisma.cupMatch.deleteMany({ where: { cupId, stage: { in: ["mata", "terceiro"] } } }),
    prisma.cupMatch.createMany({ data: novos }),
  ]);
  await recalcular(cupId);
  revalidar(cup.slug);
  redirect(`/admin/campeonatos/${cupId}?aba=jogos&ok=mata`);
}

// Depois de qualquer resultado: avança a chave e define campeão/status.
async function recalcular(cupId: string) {
  const cup = await buscarCampeonato(cupId);
  if (!cup) return;
  const ajustes = propagarChave(cup.matches);
  if (ajustes.length) {
    await prisma.$transaction(
      ajustes.map((a) =>
        prisma.cupMatch.update({
          where: { id: a.id },
          data: {
            homeId: a.homeId,
            awayId: a.awayId,
            ...(a.status ? { status: a.status } : {}),
            ...(a.limpar ? { homeScore: null, awayScore: null, homePens: null, awayPens: null, partials: null } : {}),
          },
        }),
      ),
    );
    // Lances de jogos que mudaram de times não fazem mais sentido.
    const limpos = ajustes.filter((a) => a.limpar).map((a) => a.id);
    if (limpos.length) await prisma.cupEvent.deleteMany({ where: { matchId: { in: limpos } } });
  }
  const atualizado = ajustes.length ? await buscarCampeonato(cupId) : cup;
  if (!atualizado || atualizado.matches.length === 0) return;
  const tabelas = tabelasDo(atualizado);
  const grupo = atualizado.matches.filter((m) => m.stage === "grupo");
  const p = podio(atualizado.format, atualizado.format === "liga" ? grupo : atualizado.matches, tabelas.get(""));
  const status = p.campeao ? "encerrado" : "andamento";
  if (status !== atualizado.status) await prisma.cup.update({ where: { id: cupId }, data: { status } });
}

// ===================== jogos =====================

export async function saveMatch(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const jogo = await prisma.cupMatch.findUnique({ where: { id }, include: { cup: true } });
  if (!jogo) redirect("/admin/campeonatos");
  const esp = esporte(jogo.cup.sport);
  const padrao = `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${id}`;
  const erro = (codigo: string): never => voltarComErro(fd, padrao, codigo);

  let homeScore = intOuNull(fd, "homeScore");
  let awayScore = intOuNull(fd, "awayScore");
  let partials: string | null = null;
  if (esp.placar === "sets") {
    const p = setsDasParciais(txt(fd, "partials", 120));
    if (p) {
      homeScore = p.home;
      awayScore = p.away;
      partials = p.validas;
    }
  }
  const statusRaw = txt(fd, "status", 12);
  let status = ["agendado", "ao_vivo", "encerrado"].includes(statusRaw) ? statusRaw : jogo.status;
  if (fd.get("encerrar") === "1") status = "encerrado";

  const homePens = intOuNull(fd, "homePens");
  const awayPens = intOuNull(fd, "awayPens");
  const mataMata = jogo.stage !== "grupo";
  if (status === "encerrado") {
    if (homeScore == null || awayScore == null) erro("sem-placar");
    if (mataMata && homeScore === awayScore && (homePens == null || awayPens == null || homePens === awayPens)) {
      erro("empate-mata");
    }
    if (!mataMata && !jogo.cup.allowDraw && homeScore === awayScore) {
      erro("sem-empate");
    }
  }

  const dataRaw = txt(fd, "date", 20);
  await prisma.cupMatch.update({
    where: { id },
    data: {
      homeScore,
      awayScore,
      homePens: mataMata && homeScore === awayScore ? homePens : null,
      awayPens: mataMata && homeScore === awayScore ? awayPens : null,
      partials,
      status,
      ...(fd.has("date") ? { date: dataRaw ? parseDataLocal(dataRaw) : null } : {}),
      ...(fd.has("location") ? { location: txt(fd, "location", 120) || null } : {}),
    },
  });
  await recalcular(jogo.cupId);
  revalidar(jogo.cup.slug);
  voltar(fd, padrao);
}

// Botões +1 / -1 do placar ao vivo.
export async function placarRapido(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const lado = fd.get("lado") === "away" ? "away" : "home";
  const delta = fd.get("delta") === "-1" ? -1 : 1;
  const jogo = await prisma.cupMatch.findUnique({ where: { id }, include: { cup: { select: { slug: true } } } });
  if (!jogo) redirect("/admin/campeonatos");
  const campo = lado === "home" ? "homeScore" : "awayScore";
  const atual = jogo[campo] ?? 0;
  await prisma.cupMatch.update({
    where: { id },
    data: {
      [campo]: Math.max(0, atual + delta),
      [lado === "home" ? "awayScore" : "homeScore"]: (lado === "home" ? jogo.awayScore : jogo.homeScore) ?? 0,
      status: jogo.status === "agendado" ? "ao_vivo" : jogo.status,
    },
  });
  if (jogo.status === "encerrado") await recalcular(jogo.cupId);
  revalidar(jogo.cup.slug);
  voltar(fd, `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${id}`);
}

export async function setMatchStatus(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const status = txt(fd, "status", 12);
  const jogo = await prisma.cupMatch.findUnique({ where: { id }, include: { cup: { select: { slug: true } } } });
  if (!jogo || !["agendado", "ao_vivo"].includes(status)) redirect("/admin/campeonatos");
  await prisma.cupMatch.update({
    where: { id },
    data: {
      status,
      ...(status === "ao_vivo" ? { homeScore: jogo.homeScore ?? 0, awayScore: jogo.awayScore ?? 0 } : {}),
    },
  });
  await recalcular(jogo.cupId);
  revalidar(jogo.cup.slug);
  voltar(fd, `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${id}`);
}

// ===================== lances (gols, cartões, destaque) =====================

export async function addEvent(fd: FormData) {
  await requireUser();
  const matchId = txt(fd, "matchId", 40);
  const jogo = await prisma.cupMatch.findUnique({ where: { id: matchId }, include: { cup: true } });
  if (!jogo) redirect("/admin/campeonatos");
  const teamId = txt(fd, "teamId", 40);
  const kind = txt(fd, "kind", 10);
  const player = txt(fd, "player", 60);
  if (!player || !["gol", "amarelo", "vermelho", "destaque"].includes(kind) || ![jogo.homeId, jogo.awayId].includes(teamId)) {
    voltarComErro(fd, `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${matchId}`, "lance");
  }
  await prisma.cupEvent.create({
    data: { matchId, teamId, player, kind, minute: intOuNull(fd, "minute") },
  });
  // Gol soma no placar automaticamente (esportes de gol/ponto).
  if (kind === "gol" && esporte(jogo.cup.sport).placar === "gols") {
    const campo = teamId === jogo.homeId ? "homeScore" : "awayScore";
    await prisma.cupMatch.update({
      where: { id: matchId },
      data: {
        homeScore: (jogo.homeScore ?? 0) + (campo === "homeScore" ? 1 : 0),
        awayScore: (jogo.awayScore ?? 0) + (campo === "awayScore" ? 1 : 0),
        status: jogo.status === "agendado" ? "ao_vivo" : jogo.status,
      },
    });
    if (jogo.status === "encerrado") await recalcular(jogo.cupId);
  }
  revalidar(jogo.cup.slug);
  voltar(fd, `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${matchId}`);
}

export async function deleteEvent(fd: FormData) {
  await requireUser();
  const id = txt(fd, "id", 40);
  const ev = await prisma.cupEvent.findUnique({ where: { id }, include: { match: { include: { cup: true } } } });
  if (!ev) redirect("/admin/campeonatos");
  await prisma.cupEvent.delete({ where: { id } });
  const jogo = ev.match;
  if (ev.kind === "gol" && esporte(jogo.cup.sport).placar === "gols") {
    const casa = ev.teamId === jogo.homeId;
    await prisma.cupMatch.update({
      where: { id: jogo.id },
      data: casa
        ? { homeScore: Math.max(0, (jogo.homeScore ?? 0) - 1) }
        : { awayScore: Math.max(0, (jogo.awayScore ?? 0) - 1) },
    });
    if (jogo.status === "encerrado") await recalcular(jogo.cupId);
  }
  revalidar(jogo.cup.slug);
  voltar(fd, `/admin/campeonatos/${jogo.cupId}?aba=jogos#j-${jogo.id}`);
}
