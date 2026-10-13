import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fmtDataHora } from "@/lib/datas";

export const dynamic = "force-dynamic";

// Resumo da comissão para automações (ex: n8n envia por e-mail toda segunda).
//
// Protegido por token: o n8n manda o segredo no header x-resumo-token
// (ou em ?token=). Configure RESUMO_TOKEN nas variáveis de ambiente (Vercel)
// e use o MESMO valor no nó HTTP do n8n.
//
// Devolve o assunto e o corpo (HTML e texto) já prontos, além dos dados crus,
// para o n8n só precisar enviar. NÃO expõe telefone/e-mail de atleta: este
// endpoint é chamado de forma autenticada e o resultado vai só para a comissão.

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const ORDEM = [1, 2, 3, 4, 5, 6, 0]; // exibição Segunda -> Domingo

// Compara o token em tempo constante (evita vazar o segredo por timing).
function tokenConfere(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Escapa texto que vai dentro do HTML do e-mail (nomes vêm de inscrição pública).
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const esperado = process.env.RESUMO_TOKEN;
  if (!esperado) {
    return NextResponse.json(
      { error: "RESUMO_TOKEN não configurado no servidor." },
      { status: 503 },
    );
  }
  const recebido =
    req.headers.get("x-resumo-token") || req.nextUrl.searchParams.get("token") || "";
  if (!tokenConfere(recebido, esperado)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Janela para "novas inscrições" (padrão: últimos 7 dias). Ex: ?dias=1 (diário).
  const dias = Math.max(1, Math.min(90, Number(req.nextUrl.searchParams.get("dias")) || 7));
  const agora = new Date();
  const desde = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);

  const [torneios, eventos, treinos, novasTorneio, novasTreino] = await Promise.all([
    // Torneios abertos ou com data futura (sem carregar a foto).
    prisma.tournament.findMany({
      where: { OR: [{ open: true }, { date: { gte: agora } }] },
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        date: true,
        location: true,
        open: true,
        _count: { select: { signups: true } },
      },
    }),
    // Próximos eventos do calendário.
    prisma.calendarEvent.findMany({
      where: { date: { gte: agora } },
      orderBy: { date: "asc" },
      take: 12,
      select: { id: true, title: true, date: true, location: true },
    }),
    // Grade de treinos com total de participantes.
    prisma.training.findMany({
      select: {
        id: true,
        modality: true,
        weekday: true,
        time: true,
        location: true,
        _count: { select: { signups: true } },
      },
    }),
    // Novas inscrições em torneios na janela.
    prisma.tournamentSignup.findMany({
      where: { createdAt: { gte: desde } },
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true, tournament: { select: { title: true } } },
    }),
    // Novas inscrições em treinos na janela.
    prisma.trainingSignup.findMany({
      where: { createdAt: { gte: desde } },
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true, training: { select: { modality: true } } },
    }),
  ]);

  treinos.sort(
    (a, b) => ORDEM.indexOf(a.weekday) - ORDEM.indexOf(b.weekday) || a.time.localeCompare(b.time),
  );

  const totalInscritosAbertos = torneios
    .filter((t) => t.open)
    .reduce((acc, t) => acc + t._count.signups, 0);
  const totalParticipantesTreinos = treinos.reduce((acc, t) => acc + t._count.signups, 0);

  // ---- Dados crus (para o n8n montar algo próprio, se quiser) ----
  const dados = {
    geradoEm: agora.toISOString(),
    janelaDias: dias,
    totais: {
      torneiosAbertos: torneios.filter((t) => t.open).length,
      inscritosEmTorneiosAbertos: totalInscritosAbertos,
      participantesEmTreinos: totalParticipantesTreinos,
      novasInscricoesTorneio: novasTorneio.length,
      novasInscricoesTreino: novasTreino.length,
    },
    torneios: torneios.map((t) => ({
      titulo: t.title,
      quando: t.date ? fmtDataHora(t.date) : null,
      local: t.location ?? null,
      aberto: t.open,
      inscritos: t._count.signups,
      link: `/torneios/${t.slug ?? t.id}`,
    })),
    proximosEventos: eventos.map((e) => ({
      titulo: e.title,
      quando: fmtDataHora(e.date),
      local: e.location ?? null,
    })),
    treinos: treinos.map((t) => ({
      modalidade: t.modality,
      dia: DIAS[t.weekday],
      horario: t.time,
      local: t.location ?? null,
      participantes: t._count.signups,
    })),
  };

  // ---- Corpo em texto puro ----
  const linhas: string[] = [];
  linhas.push("RESUMO DA COMISSAO DE ESPORTES UNIFIQUE");
  linhas.push(`Gerado em ${fmtDataHora(agora)} (janela de ${dias} dia(s))`);
  linhas.push("");
  linhas.push("== Visao geral ==");
  linhas.push(`Torneios com inscricoes abertas: ${dados.totais.torneiosAbertos}`);
  linhas.push(`Inscritos nesses torneios: ${totalInscritosAbertos}`);
  linhas.push(`Participantes na grade de treinos: ${totalParticipantesTreinos}`);
  linhas.push(
    `Novas inscricoes nos ultimos ${dias} dia(s): ${novasTorneio.length} em torneios, ${novasTreino.length} em treinos`,
  );
  linhas.push("");
  linhas.push("== Torneios ==");
  if (torneios.length === 0) linhas.push("(nenhum torneio ativo)");
  for (const t of torneios) {
    const partes = [
      t.date ? fmtDataHora(t.date) : "sem data",
      t.location || null,
      `${t._count.signups} inscrito(s)`,
      t.open ? "ABERTO" : "encerrado",
    ].filter(Boolean);
    linhas.push(`- ${t.title} (${partes.join(" | ")})`);
  }
  linhas.push("");
  linhas.push("== Proximos eventos (calendario) ==");
  if (eventos.length === 0) linhas.push("(nenhum evento futuro)");
  for (const e of eventos) {
    linhas.push(`- ${fmtDataHora(e.date)} - ${e.title}${e.location ? ` (${e.location})` : ""}`);
  }
  linhas.push("");
  linhas.push("== Grade de treinos ==");
  if (treinos.length === 0) linhas.push("(nenhum treino cadastrado)");
  for (const t of treinos) {
    linhas.push(
      `- ${DIAS[t.weekday]} ${t.time} - ${t.modality}${t.location ? ` (${t.location})` : ""}: ${t._count.signups} participante(s)`,
    );
  }
  const texto = linhas.join("\n");

  // ---- Corpo em HTML (e-mail) ----
  const linhaTorneios =
    torneios.length === 0
      ? `<li style="color:#888">Nenhum torneio ativo.</li>`
      : torneios
          .map((t) => {
            const meta = [
              t.date ? esc(fmtDataHora(t.date)) : "sem data",
              t.location ? esc(t.location) : null,
              `${t._count.signups} inscrito(s)`,
            ]
              .filter(Boolean)
              .join(" &middot; ");
            const tag = t.open
              ? `<span style="background:#dcfce7;color:#15803d;border-radius:9999px;padding:1px 8px;font-size:12px;font-weight:600">abertas</span>`
              : `<span style="background:#f3f4f6;color:#6b7280;border-radius:9999px;padding:1px 8px;font-size:12px;font-weight:600">encerrado</span>`;
            return `<li style="margin-bottom:6px"><strong>${esc(t.title)}</strong> ${tag}<br><span style="color:#555;font-size:13px">${meta}</span></li>`;
          })
          .join("");

  const linhaEventos =
    eventos.length === 0
      ? `<li style="color:#888">Nenhum evento futuro no calendário.</li>`
      : eventos
          .map(
            (e) =>
              `<li style="margin-bottom:4px"><strong>${esc(fmtDataHora(e.date))}</strong> &middot; ${esc(e.title)}${e.location ? ` <span style="color:#777">(${esc(e.location)})</span>` : ""}</li>`,
          )
          .join("");

  const linhaTreinos =
    treinos.length === 0
      ? `<li style="color:#888">Nenhum treino cadastrado.</li>`
      : treinos
          .map(
            (t) =>
              `<li style="margin-bottom:4px">${esc(DIAS[t.weekday])} ${esc(t.time)} &middot; <strong>${esc(t.modality)}</strong>${t.location ? ` <span style="color:#777">(${esc(t.location)})</span>` : ""} &middot; ${t._count.signups} participante(s)</li>`,
          )
          .join("");

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#1b2a6b;padding:20px 24px;color:#fff">
      <div style="font-size:18px;font-weight:700">Comissão de Esportes Unifique</div>
      <div style="font-size:13px;opacity:.85">Resumo &middot; ${esc(fmtDataHora(agora))}</div>
    </div>
    <div style="padding:20px 24px">
      <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:18px">
        <tr>
          <td style="padding:10px;background:#eef2ff;border-radius:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#1b2a6b">${dados.totais.torneiosAbertos}</div>
            <div style="font-size:12px;color:#555">torneios abertos</div>
          </td>
          <td style="width:10px"></td>
          <td style="padding:10px;background:#eef2ff;border-radius:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#1b2a6b">${totalInscritosAbertos}</div>
            <div style="font-size:12px;color:#555">inscritos</div>
          </td>
          <td style="width:10px"></td>
          <td style="padding:10px;background:#eef2ff;border-radius:10px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:#1b2a6b">${totalParticipantesTreinos}</div>
            <div style="font-size:12px;color:#555">em treinos</div>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#444;margin:0 0 18px">
        Novas inscrições nos últimos ${dias} dia(s):
        <strong>${novasTorneio.length}</strong> em torneios e
        <strong>${novasTreino.length}</strong> em treinos.
      </p>

      <h3 style="font-size:15px;color:#1b2a6b;margin:0 0 8px">🏆 Torneios</h3>
      <ul style="margin:0 0 18px;padding-left:18px;font-size:14px">${linhaTorneios}</ul>

      <h3 style="font-size:15px;color:#1b2a6b;margin:0 0 8px">📅 Próximos eventos</h3>
      <ul style="margin:0 0 18px;padding-left:18px;font-size:14px">${linhaEventos}</ul>

      <h3 style="font-size:15px;color:#1b2a6b;margin:0 0 8px">🏐 Grade de treinos</h3>
      <ul style="margin:0 0 6px;padding-left:18px;font-size:14px">${linhaTreinos}</ul>
    </div>
    <div style="padding:14px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center">
      Mensagem automática &middot; © Comissão de Esportes Unifique &middot; direitos reservados
    </div>
  </div>
</body></html>`;

  const assunto = `Resumo da Comissão de Esportes - ${dados.totais.torneiosAbertos} torneio(s), ${totalInscritosAbertos} inscrito(s)`;

  return NextResponse.json(
    { assunto, texto, html, dados },
    { headers: { "Cache-Control": "no-store" } },
  );
}
