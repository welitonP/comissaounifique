import { prisma } from "@/lib/prisma";
import { temColunasArquivoRegulamento } from "@/lib/schema-check";

// Entrega o arquivo do regulamento do torneio (PDF ou imagem) para abrir na
// janela "Ver regulamento" da página pública ou baixar.
const ALLOWED_MIMES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!(await temColunasArquivoRegulamento())) {
    return new Response("Sem regulamento", { status: 404 });
  }
  const t = await prisma.tournament.findUnique({
    where: { id },
    select: { rulesData: true, rulesMime: true, rulesName: true },
  });
  if (!t || !t.rulesData || !t.rulesMime) {
    return new Response("Sem regulamento", { status: 404 });
  }

  const safe = ALLOWED_MIMES.has(t.rulesMime);
  const baixar = new URL(req.url).searchParams.has("download") || !safe;
  const nome = (t.rulesName || "regulamento").replace(/["\r\n]/g, "");

  return new Response(new Uint8Array(t.rulesData), {
    headers: {
      "Content-Type": safe ? t.rulesMime : "application/octet-stream",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"`,
      "X-Content-Type-Options": "nosniff",
      // O regulamento pode ser trocado (mesmo id): cache curto.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
