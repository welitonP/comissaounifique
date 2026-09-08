import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Serve a planta guardada no banco. Só para quem está logado. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const wantsOriginal = new URL(request.url).searchParams.get("versao") === "original";

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      planImage: true,
      planMimeType: true,
      planOriginal: true,
      planOriginalMimeType: true,
      updatedAt: true,
    },
  });
  if (!event) return new Response("Não encontrado", { status: 404 });

  const image = wantsOriginal ? event.planOriginal : event.planImage;
  const mimeType = wantsOriginal ? event.planOriginalMimeType : event.planMimeType;
  if (!image || !mimeType) return new Response("Sem planta", { status: 404 });

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(image.length),
      // Privado: a planta é conteúdo interno, não pode ficar em cache de CDN.
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
