import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await prisma.announcementImage.findUnique({ where: { id } });
  if (!img) {
    return new Response("Não encontrada", { status: 404 });
  }
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // Imutável: a foto nunca muda depois de publicada
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
