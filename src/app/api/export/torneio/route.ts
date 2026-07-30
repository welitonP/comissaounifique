import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fmtDataHora } from "@/lib/datas";

export const dynamic = "force-dynamic";

// Escapa e neutraliza injeção de fórmula (nomes vêm de inscrição pública).
function cell(value: string | null | undefined): string {
  let s = (value ?? "").toString();
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  s = s.replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id") || "";
  const torneio = await prisma.tournament.findUnique({
    where: { id },
    include: { signups: { orderBy: { createdAt: "asc" } } },
  });
  if (!torneio) {
    return NextResponse.json({ error: "Torneio não encontrado." }, { status: 404 });
  }

  const perguntas = (torneio.questions || "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const header = ["Nome", "Telefone", ...perguntas, "Observação", "Inscrito em"];
  const rows = torneio.signups.map((s) => {
    let respostas: Record<string, string> = {};
    try {
      respostas = s.answers ? (JSON.parse(s.answers) as Record<string, string>) : {};
    } catch {
      respostas = {};
    }
    return [
      cell(s.name),
      cell(s.phone),
      ...perguntas.map((p) => cell(respostas[p] || "")),
      cell(s.note),
      cell(fmtDataHora(s.createdAt)),
    ];
  });

  const csv =
    "﻿" +
    [header.map(cell).join(";"), ...rows.map((cols) => cols.join(";"))].join("\r\n");

  const nomeArq = torneio.title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().slice(0, 40);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscritos-${nomeArq}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
