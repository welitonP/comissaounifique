import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { esporte } from "./esportes";
import { classificacao, nomeFase, podio, type JogoLite, type Linha, type Regras, type TimeLite } from "./motor";

const incluir = {
  teams: { orderBy: [{ group: "asc" }, { createdAt: "asc" }] },
  matches: {
    orderBy: [{ stage: "asc" }, { round: "asc" }, { group: "asc" }, { slot: "asc" }],
    include: { events: { orderBy: [{ minute: "asc" }, { createdAt: "asc" }] } },
  },
} satisfies Prisma.CupInclude;

export type CupCompleto = Prisma.CupGetPayload<{ include: typeof incluir }>;
export type JogoCompleto = CupCompleto["matches"][number];
export type TimeCompleto = CupCompleto["teams"][number];

export type Artilheiro = { player: string; teamId: string | null; gols: number };

export type Painel = {
  cup: CupCompleto;
  esp: ReturnType<typeof esporte>;
  regras: Regras;
  times: Map<string, TimeCompleto>;
  tabelas: Map<string, Linha[]>; // "" = tabela única (liga)
  jogosGrupo: JogoCompleto[];
  jogosMata: JogoCompleto[];
  terceiro: JogoCompleto | null;
  podio: { campeao: string | null; vice: string | null; terceiro: string | null };
  artilharia: Artilheiro[];
  cartoes: { player: string; teamId: string | null; amarelo: number; vermelho: number }[];
  destaques: { player: string; teamId: string | null; vezes: number }[];
  aoVivo: JogoCompleto[];
  progresso: { feitos: number; total: number };
  faseDeGruposCompleta: boolean;
};

export function regrasDo(cup: { pointsWin: number; pointsDraw: number; pointsLoss: number; setsToWin: number; sport: string }): Regras {
  return {
    pointsWin: cup.pointsWin,
    pointsDraw: cup.pointsDraw,
    pointsLoss: cup.pointsLoss,
    setsToWin: cup.setsToWin,
    pontuacaoVolei: !!esporte(cup.sport).pontuacaoVolei,
  };
}

export function lite(j: JogoCompleto): JogoLite {
  return j;
}

export function timeLite(t: TimeCompleto): TimeLite {
  return { id: t.id, name: t.name, color: t.color, group: t.group, seeded: t.seeded };
}

// Tabelas por grupo (ou uma só, na liga).
export function tabelasDo(cup: CupCompleto): Map<string, Linha[]> {
  const regras = regrasDo(cup);
  const grupoJogos = cup.matches.filter((m) => m.stage === "grupo");
  const tabelas = new Map<string, Linha[]>();
  if (cup.format === "liga") {
    tabelas.set("", classificacao(cup.teams.map(timeLite), grupoJogos, regras));
  } else if (cup.format === "grupos") {
    const grupos = [...new Set(cup.teams.map((t) => t.group).filter((g): g is string => !!g))].sort();
    for (const g of grupos) {
      tabelas.set(
        g,
        classificacao(
          cup.teams.filter((t) => t.group === g).map(timeLite),
          grupoJogos.filter((m) => m.group === g),
          regras,
        ),
      );
    }
  }
  return tabelas;
}

export async function buscarCampeonato(idOuSlug: string): Promise<CupCompleto | null> {
  return prisma.cup.findFirst({
    where: { OR: [{ id: idOuSlug }, { slug: idOuSlug }] },
    include: incluir,
  });
}

export function montarPainel(cup: CupCompleto): Painel {
  const esp = esporte(cup.sport);
  const regras = regrasDo(cup);
  const times = new Map(cup.teams.map((t) => [t.id, t]));
  const tabelas = tabelasDo(cup);
  const jogosGrupo = cup.matches.filter((m) => m.stage === "grupo");
  const jogosMata = cup.matches.filter((m) => m.stage === "mata");
  const terceiro = cup.matches.find((m) => m.stage === "terceiro") ?? null;

  const artMap = new Map<string, Artilheiro>();
  const cartMap = new Map<string, { player: string; teamId: string | null; amarelo: number; vermelho: number }>();
  const destMap = new Map<string, { player: string; teamId: string | null; vezes: number }>();
  for (const m of cup.matches) {
    for (const ev of m.events) {
      const chave = `${ev.player.trim().toLowerCase()}|${ev.teamId ?? ""}`;
      if (ev.kind === "gol") {
        const a = artMap.get(chave) ?? { player: ev.player, teamId: ev.teamId, gols: 0 };
        a.gols++;
        artMap.set(chave, a);
      } else if (ev.kind === "amarelo" || ev.kind === "vermelho") {
        const c = cartMap.get(chave) ?? { player: ev.player, teamId: ev.teamId, amarelo: 0, vermelho: 0 };
        c[ev.kind]++;
        cartMap.set(chave, c);
      } else if (ev.kind === "destaque") {
        const d = destMap.get(chave) ?? { player: ev.player, teamId: ev.teamId, vezes: 0 };
        d.vezes++;
        destMap.set(chave, d);
      }
    }
  }

  const reais = cup.matches.filter((m) => m.status !== "folga");
  const faseDeGruposCompleta =
    jogosGrupo.length > 0 && jogosGrupo.every((m) => m.status === "encerrado");

  return {
    cup,
    esp,
    regras,
    times,
    tabelas,
    jogosGrupo,
    jogosMata,
    terceiro,
    podio: podio(cup.format, cup.format === "liga" ? jogosGrupo : cup.matches, tabelas.get("")),
    artilharia: [...artMap.values()].sort((a, b) => b.gols - a.gols || a.player.localeCompare(b.player)),
    cartoes: [...cartMap.values()].sort((a, b) => b.vermelho - a.vermelho || b.amarelo - a.amarelo),
    destaques: [...destMap.values()].sort((a, b) => b.vezes - a.vezes),
    aoVivo: cup.matches.filter((m) => m.status === "ao_vivo"),
    progresso: { feitos: reais.filter((m) => m.status === "encerrado").length, total: reais.length },
    faseDeGruposCompleta,
  };
}

// As tabelas de campeonato entram com `npm run db:push`. Enquanto não
// existirem, as páginas mostram um aviso em vez de quebrar.
export function tabelaNaoExiste(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2021" || e.code === "P2022");
}

export function slugify(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "campeonato";
}

// ===================== Etapas (rodadas e fases) =====================

export type Etapa = { id: string; titulo: string; curto: string; jogos: JogoCompleto[] };

// Rodadas da fase de pontos + fases do mata-mata, na ordem em que acontecem.
// O 3º lugar entra junto da final.
export function etapasDo(painel: Painel): Etapa[] {
  const etapas: Etapa[] = [];
  const grupo = painel.jogosGrupo;
  const rodadas = [...new Set(grupo.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of rodadas) {
    etapas.push({
      id: `r${r}`,
      titulo: `${r}ª rodada`,
      curto: `R${r}`,
      jogos: grupo.filter((m) => m.round === r).sort((a, b) => (a.group ?? "").localeCompare(b.group ?? "") || a.slot - b.slot),
    });
  }
  const fases = [...new Set(painel.jogosMata.map((m) => m.round))].sort((a, b) => a - b);
  for (const r of fases) {
    const todos = painel.jogosMata.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot);
    const nome = nomeFase(todos.length);
    const ultima = r === fases[fases.length - 1];
    const jogos = todos.filter((m) => m.status !== "folga");
    if (ultima && painel.terceiro) jogos.unshift(painel.terceiro);
    if (jogos.length === 0) continue;
    etapas.push({
      id: `m${r}`,
      titulo: ultima && painel.terceiro ? "Finais" : nome,
      curto: nome === "Final" || ultima ? "Final" : nome === "Semifinal" ? "Semi" : nome.split(" ")[0],
      jogos,
    });
  }
  return etapas;
}

// Etapa "da vez": a primeira que ainda tem jogo sem resultado.
export function etapaAtual(etapas: Etapa[]): Etapa | undefined {
  return (
    etapas.find((e) => e.jogos.some((j) => j.status === "ao_vivo")) ??
    etapas.find((e) => e.jogos.some((j) => j.status !== "encerrado")) ??
    etapas[etapas.length - 1]
  );
}

export function rotuloDoJogo(j: JogoCompleto, painel: Painel): string {
  if (j.stage === "terceiro") return "3º lugar";
  if (j.stage === "mata") return nomeFase(painel.jogosMata.filter((m) => m.round === j.round).length);
  return `${j.group ? `Grupo ${j.group} · ` : ""}${j.round}ª rodada`;
}
