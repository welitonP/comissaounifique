import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Gera um arquivo .ics (iCalendar) para o torneio, pra pessoa salvar no
// Google/Apple Agenda. Só funciona se o torneio tiver data marcada.

// Escapa texto conforme a RFC 5545 (vírgula, ponto-e-vírgula, barra, quebra).
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Formata uma data em UTC no padrão iCalendar: 20260418T190000Z
function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: ref } = await params;
  const t = await prisma.tournament.findFirst({
    where: { OR: [{ slug: ref }, { id: ref }] },
    select: { id: true, slug: true, title: true, description: true, location: true, date: true },
  });

  if (!t || !t.date) {
    return NextResponse.json(
      { error: "Torneio sem data definida." },
      { status: 404 },
    );
  }

  const inicio = new Date(t.date);
  const fim = new Date(inicio.getTime() + 2 * 60 * 60 * 1000); // duração padrão: 2h
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.unifiqueesportes.com.br";
  const link = `${siteUrl}/torneios/${t.slug ?? t.id}`;
  const descricao = [t.description?.trim(), `Inscrições e detalhes: ${link}`]
    .filter(Boolean)
    .join("\n\n");

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Comissao de Esportes Unifique//Torneios//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:torneio-${t.id}@unifiqueesportes.com.br`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(inicio)}`,
    `DTEND:${toICSDate(fim)}`,
    `SUMMARY:${esc(t.title)}`,
    `DESCRIPTION:${esc(descricao)}`,
    ...(t.location ? [`LOCATION:${esc(t.location)}`] : []),
    `URL:${esc(link)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // iCalendar pede quebra de linha CRLF.
  const ics = linhas.join("\r\n");

  const nomeArquivo = (t.slug ?? "torneio").replace(/[^a-z0-9-]/gi, "-").slice(0, 40);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
