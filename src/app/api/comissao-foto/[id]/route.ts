import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const member = await prisma.commissionMember.findUnique({ where: { id } });
  if (!member || !member.photoData || !member.photoMime) {
    return new Response("Sem foto", { status: 404 });
  }
  return new Response(new Uint8Array(member.photoData), {
    headers: {
      "Content-Type": member.photoMime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
