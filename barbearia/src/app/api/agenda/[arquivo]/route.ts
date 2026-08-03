// Gera um arquivo .ics para o cliente salvar o horário na agenda do celular.
// Endereço: /api/agenda/<token>.ics

import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";

function paraICS(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Quebra de linha e escape exigidos pelo formato iCalendar.
function escapar(texto: string): string {
  return texto.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ arquivo: string }> },
) {
  const { arquivo } = await params;
  const token = arquivo.replace(/\.ics$/i, "");

  const agendamento = await prisma.agendamento.findUnique({
    where: { token },
    include: { profissional: true, servico: true },
  });
  if (!agendamento || agendamento.status !== "agendado") {
    return new Response("Agendamento não encontrado.", { status: 404 });
  }

  const config = await getConfig();
  const titulo = `${agendamento.servico.nome} — ${config.nome}`;
  const descricao = `Com ${agendamento.profissional.apelido || agendamento.profissional.nome}.`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//barbearia//agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${agendamento.token}@barbearia`,
    `DTSTAMP:${paraICS(new Date())}`,
    `DTSTART:${paraICS(agendamento.inicio)}`,
    `DTEND:${paraICS(agendamento.fim)}`,
    `SUMMARY:${escapar(titulo)}`,
    `DESCRIPTION:${escapar(descricao)}`,
    config.endereco ? `LOCATION:${escapar(config.endereco)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${token.slice(-6)}.ics"`,
    },
  });
}
