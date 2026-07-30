import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fmtDataHora } from "@/lib/datas";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Exibição Segunda -> Domingo.
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

// Escapa e neutraliza injeção de fórmula (nomes vêm de inscrição pública).
function cell(value: string | null | undefined): string {
  let s = (value ?? "").toString();
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  s = s.replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const treinos = await prisma.training.findMany({
    include: { signups: { orderBy: { createdAt: "asc" } } },
  });
  // Ordena por dia (Segunda -> Domingo) e depois por horário.
  treinos.sort(
    (a, b) => ORDEM.indexOf(a.weekday) - ORDEM.indexOf(b.weekday) || a.time.localeCompare(b.time),
  );

  const header = ["Dia", "Horário", "Modalidade", "Local", "Nome", "WhatsApp", "Inscrito em"];
  const rows: string[][] = [];
  for (const t of treinos) {
    for (const s of t.signups) {
      rows.push([
        cell(DIAS[t.weekday]),
        cell(t.time),
        cell(t.modality),
        cell(t.location),
        cell(s.name),
        cell(s.phone),
        cell(fmtDataHora(s.createdAt)),
      ]);
    }
  }

  const csv =
    "﻿" +
    [header.map(cell).join(";"), ...rows.map((cols) => cols.join(";"))].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscritos-treinos.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
