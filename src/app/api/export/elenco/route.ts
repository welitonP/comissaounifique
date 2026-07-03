import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Escapa um campo para CSV (aspas e ponto e vírgula, padrão Excel pt-BR).
function cell(value: string | null | undefined): string {
  const s = (value ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  // Dados sensíveis: só a comissão logada pode exportar.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const modalityId = req.nextUrl.searchParams.get("modality") || "";

  const registrations = await prisma.registration.findMany({
    where: modalityId && modalityId !== "all" ? { modalityId } : undefined,
    include: { modality: { select: { name: true } } },
    orderBy: [{ modality: { name: "asc" } }, { companyName: "asc" }],
  });

  const header = ["Nome", "Modalidade", "Nascimento / Info", "Telefone / Contato"];
  const rows = registrations.map((r) => [
    cell(r.companyName),
    cell(r.modality?.name),
    cell(r.responsible),
    cell(r.contact),
  ]);

  // BOM (﻿) para o Excel abrir os acentos corretamente.
  const csv =
    "﻿" + [header.map(cell).join(";"), ...rows.map((cols) => cols.join(";"))].join("\r\n");

  const hoje = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elenco-unifique-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
