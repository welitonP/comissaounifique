"use server";

import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { askGemini } from "./gemini";

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
      `- ${new Date(e.date).toLocaleString("pt-BR")} — ${e.title}${e.modality ? ` (${e.modality.name})` : ""}${e.location ? ` em ${e.location}` : ""}`,
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
  "Você é o assistente virtual da Comissão de Esportes da Unifique, uma empresa. " +
  "A comissão organiza a participação da Unifique em eventos esportivos (como o campeonato " +
  "Entre Empresas) e cuida de materiais, uniformes, calendário e comunicados internos. " +
  "Responda em português do Brasil, de forma curta, direta, cordial e profissional. " +
  "Use SOMENTE as informações fornecidas no contexto. Se a resposta não estiver no contexto, " +
  "diga que não há essa informação cadastrada.";

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
        " Agora você vai redigir um comunicado interno. Responda EXATAMENTE neste formato:\n" +
        "TITULO: <um título curto>\nCORPO: <o texto do comunicado, 2 a 4 frases>",
      `Escreva um comunicado da comissão sobre: ${topic}`,
    );
    const titleMatch = raw.match(/TITULO:\s*(.+)/i);
    const bodyMatch = raw.match(/CORPO:\s*([\s\S]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : topic;
    const body = bodyMatch ? bodyMatch[1].trim() : raw;
    return { title, body };
  } catch (e) {
    return { title: "", body: "", error: e instanceof Error ? e.message : "Erro na IA." };
  }
}
