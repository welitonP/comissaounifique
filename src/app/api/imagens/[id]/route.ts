import { prisma } from "@/lib/prisma";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await prisma.announcementImage.findUnique({ where: { id } });
  if (!img) {
    return new Response("Não encontrada", { status: 404 });
  }
  const safe = ALLOWED_MIMES.has(img.mime);
  return new Response(new Uint8Array(img.data), {
    headers: {
      // Se o formato não for reconhecido como seguro, força download em vez de renderizar
      "Content-Type": safe ? img.mime : "application/octet-stream",
      ...(safe ? {} : { "Content-Disposition": "attachment" }),
      "X-Content-Type-Options": "nosniff",
      // Imutável: a foto nunca muda depois de publicada
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
