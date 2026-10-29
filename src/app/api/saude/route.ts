import { prisma } from "@/lib/prisma";

// Endereço de "saúde" do site, para monitoramento (ex: n8n a cada 5 minutos).
// Responde 200 quando o site e o banco estão funcionando e 503 quando o banco
// não responde. Não expõe nenhum dado.
export const dynamic = "force-dynamic";

export async function GET() {
  const inicio = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { ok: true, banco: "ok", ms: Date.now() - inicio },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, banco: "fora do ar" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
