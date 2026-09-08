import { getSession } from "@/lib/auth";
import { loadEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Backup completo em JSON. Não inclui a imagem da planta — ela é grande e
 * continua guardada no banco; o objetivo aqui é levar os dados embora.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await getSession())) return new Response("Não autorizado", { status: 401 });

  const { slug } = await params;
  const loaded = await loadEvent(slug);
  if (!loaded) return new Response("Evento não encontrado", { status: 404 });

  const { event, points, equipments, cables, summary } = loaded;

  const payload = {
    formato: "controle-instalacao/1",
    geradoEm: new Date().toISOString(),
    evento: {
      slug: event.slug,
      nome: event.name,
      cidade: event.city,
      endereco: event.address,
      inicio: event.startsAt,
      termino: event.endsAt,
      observacoes: event.notes,
    },
    resumo: summary,
    // eventId sai fora: o backup já é de um evento só, e o id não vale em outro banco.
    pontos: points.map(({ eventId: _eventId, ...point }) => point),
    equipamentos: equipments.map(({ eventId: _eventId, ...equipment }) => equipment),
    // "waypoints" é o campo cru do Prisma; "path" abaixo é a versão já validada.
    cabos: cables.map(({ eventId: _eventId, waypoints: _waypoints, ...cable }) => cable),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-backup.json"`,
      "Cache-Control": "no-store",
    },
  });
}
