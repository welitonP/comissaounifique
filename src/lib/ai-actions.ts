"use server";

import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { askGemini } from "./gemini";
import { fmtDataHora } from "./datas";

// Monta um resumo textual dos dados da comissão para servir de contexto à IA.
async function buildContext(): Promise<string> {
  const now = new Date();
  const [materials, items, events, modalities, announcements] = await Promise.all([
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.trackedItem.findMany({ orderBy: { name: "asc" } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date(now.toDateString()) } },
      orderBy: { date: "asc" },
      take: 20,
      include: { modality: true },
    }),
    prisma.modality.findMany({
      orderBy: { name: "asc" },
      include: { registrations: true },
    }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const lines: string[] = [];

  lines.push("### Estoque de materiais:");
  if (materials.length === 0) lines.push("(nenhum material cadastrado)");
  for (const m of materials) {
    lines.push(`- ${m.name}${m.category ? ` [${m.category}]` : ""}: ${m.quantity} unidade(s)${m.notes ? ` (${m.notes})` : ""}`);
  }

  lines.push("\n### Uniformes/itens controlados (quem está com cada um):");
  if (items.length === 0) lines.push("(nenhum item cadastrado)");
  for (const it of items) {
    lines.push(
      `- ${it.name}${it.category ? ` [${it.category}]` : ""}: ${
        it.holderName
          ? `com ${it.holderName}${it.since ? ` desde ${new Date(it.since).toLocaleDateString("pt-BR")}` : ""}`
          : "disponível na comissão"
      }`,
    );
  }

  lines.push("\n### Próximos eventos (calendário):");
  if (events.length === 0) lines.push("(nenhum evento futuro)");
  for (const e of events) {
    lines.push(
      `- ${fmtDataHora(e.date)}: ${e.title}${e.modality ? ` (${e.modality.name})` : ""}${e.location ? ` em ${e.location}` : ""}`,
    );
  }

  lines.push("\n### Modalidades do Entre Empresas e nosso elenco:");
  if (modalities.length === 0) lines.push("(nenhuma modalidade)");
  for (const mod of modalities) {
    const atletas = mod.registrations.map((r) => r.companyName).join(", ") || "sem atletas cadastrados";
    lines.push(`- ${mod.name}: ${atletas}`);
  }

  lines.push("\n### Comunicados recentes:");
  if (announcements.length === 0) lines.push("(nenhum comunicado)");
  for (const a of announcements) {
    lines.push(`- ${a.title}`);
  }

  return lines.join("\n");
}

const BASE_SYSTEM =
  "Você é o Pablinho, assistente virtual da Comissão de Esportes da Unifique. " +
  "A comissão representa a Unifique em eventos esportivos (como a Olimpíada Entre Empresas) e " +
  "cuida de materiais, uniformes, calendário, inscrições e comunicados internos. " +
  "Fale em português do Brasil de forma natural, cordial, objetiva e profissional, como um colega " +
  "de equipe prestativo. Responda saudações e agradecimentos normalmente. " +
  "Baseie as respostas sobre dados da comissão (eventos, estoque, elenco, comunicados) no CONTEXTO " +
  "fornecido; quando a informação específica não estiver no contexto, diga com clareza que ela " +
  "ainda não está cadastrada e oriente quem procurar, em vez de inventar. " +
  "Nunca use travessão (—); escreva frases completas e bem pontuadas.";

export type AssistantState = { question: string; answer: string; error?: string };

export async function askAssistant(
  _prev: AssistantState | null,
  formData: FormData,
): Promise<AssistantState> {
  await requireUser();
  const question = String(formData.get("question") || "").trim();
  if (!question) return { question: "", answer: "" };
  try {
    const context = await buildContext();
    const answer = await askGemini(
      BASE_SYSTEM,
      `Contexto atual da comissão:\n${context}\n\nPergunta do membro: ${question}`,
    );
    return { question, answer };
  } catch (e) {
    return { question, answer: "", error: e instanceof Error ? e.message : "Erro na IA." };
  }
}

export type SummaryState = { summary: string; error?: string };

export async function weeklySummary(
  _prev: SummaryState | null,
  _formData: FormData,
): Promise<SummaryState> {
  await requireUser();
  try {
    const context = await buildContext();
    const summary = await askGemini(
      BASE_SYSTEM,
      `Com base no contexto abaixo, faça um resumo curto (bullet points) para a comissão sobre a semana: ` +
        `próximos eventos/jogos, itens emprestados que ainda não voltaram e qualquer ponto de atenção. ` +
        `Seja objetivo.\n\nContexto:\n${context}`,
    );
    return { summary };
  } catch (e) {
    return { summary: "", error: e instanceof Error ? e.message : "Erro na IA." };
  }
}

export type ComposeState = { title: string; body: string; error?: string };

export async function generateAnnouncement(
  _prev: ComposeState | null,
  formData: FormData,
): Promise<ComposeState> {
  await requireUser();
  const topic = String(formData.get("topic") || "").trim();
  if (!topic) return { title: "", body: "" };
  try {
    const raw = await askGemini(
      BASE_SYSTEM +
        "\n\nTAREFA: redigir um comunicado interno curto e completo para os atletas e a comissão. " +
        "Regras: título objetivo (máx. 8 palavras); corpo de 2 a 4 frases completas, tom claro e " +
        "acolhedor; sem travessão (—); termine sempre com a frase inteira, nunca corte no meio. " +
        "Responda SOMENTE neste formato, sem comentários extras:\n" +
        "TITULO: <título>\nCORPO: <texto do comunicado>",
      `Assunto do comunicado: ${topic}`,
    );
    const titleMatch = raw.match(/T[IÍ]TULO:\s*(.+)/i);
    const bodyMatch = raw.match(/CORPO:\s*([\s\S]+)/i);
    const clean = (s: string) => s.replace(/\s*—\s*/g, ", ").trim();
    const title = titleMatch ? clean(titleMatch[1]) : topic;
    const body = bodyMatch ? clean(bodyMatch[1]) : clean(raw);
    return { title, body };
  } catch (e) {
    return { title: "", body: "", error: e instanceof Error ? e.message : "Erro na IA." };
  }
}
