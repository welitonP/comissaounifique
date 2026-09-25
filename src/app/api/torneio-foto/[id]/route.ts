import { prisma } from "@/lib/prisma";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = await prisma.tournament.findUnique({
    where: { id },
    select: { photoData: true, photoMime: true },
  });
  if (!t || !t.photoData || !t.photoMime) {
    return new Response("Sem foto", { status: 404 });
  }
  const safe = ALLOWED_MIMES.has(t.photoMime);
  return new Response(new Uint8Array(t.photoData), {
    headers: {
      "Content-Type": safe ? t.photoMime : "application/octet-stream",
      ...(safe ? {} : { "Content-Disposition": "attachment" }),
      "X-Content-Type-Options": "nosniff",
      // O cartaz pode ser trocado (mesmo id): cache moderado. s-maxage deixa a
      // CDN do Vercel guardar; edições aparecem em até 1 hora.
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
