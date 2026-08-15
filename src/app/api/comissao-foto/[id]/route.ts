import { prisma } from "@/lib/prisma";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const member = await prisma.commissionMember.findUnique({ where: { id } });
  if (!member || !member.photoData || !member.photoMime) {
    return new Response("Sem foto", { status: 404 });
  }
  const safe = ALLOWED_MIMES.has(member.photoMime);
  return new Response(new Uint8Array(member.photoData), {
    headers: {
      "Content-Type": safe ? member.photoMime : "application/octet-stream",
      ...(safe ? {} : { "Content-Disposition": "attachment" }),
      "X-Content-Type-Options": "nosniff",
      // 1 dia: a foto de um membro pode ser trocada (mesmo id). s-maxage deixa a
      // CDN do Vercel guardar dentro desse dia; stale-while-revalidate evita
      // buscar no banco no exato momento que expira.
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
