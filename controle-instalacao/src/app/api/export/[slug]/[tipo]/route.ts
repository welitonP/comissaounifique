import { getSession } from "@/lib/auth";
import { loadEvent } from "@/lib/events";
import { csvResponse, toCsv } from "@/lib/csv";
import { CABLE_STATUS, EQUIPMENT_STATUS, POINT_STATUS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; tipo: string }> },
) {
  if (!(await getSession())) return new Response("Não autorizado", { status: 401 });

  const { slug, tipo } = await params;
  const loaded = await loadEvent(slug);
  if (!loaded) return new Response("Evento não encontrado", { status: 404 });

  const { event, points, equipments, cables } = loaded;

  if (tipo === "pontos") {
    const body = toCsv(
      ["numero", "nome", "setor", "situacao", "posicao", "x", "y", "responsavel", "observacoes"],
      points.map((point) => [
        point.number,
        point.name,
        point.sector ?? "",
        POINT_STATUS[point.status].label,
        point.positionChecked ? "Conferida" : "Revisar",
        point.x,
        point.y,
        point.owner ?? "",
        point.notes ?? "",
      ]),
    );
    return csvResponse(`${slug}-pontos.csv`, body);
  }

  if (tipo === "equipamentos") {
    const body = toCsv(
      ["numero", "nome", "setor", "tipo", "situacao", "posicao", "x", "y", "responsavel", "observacoes"],
      equipments.map((equipment) => [
        equipment.number,
        equipment.name,
        equipment.sector ?? "",
        equipment.kind ?? "",
        EQUIPMENT_STATUS[equipment.status].label,
        equipment.positionChecked ? "Conferida" : "Revisar",
        equipment.x,
        equipment.y,
        equipment.owner ?? "",
        equipment.notes ?? "",
      ]),
    );
    return csvResponse(`${slug}-equipamentos.csv`, body);
  }

  if (tipo === "cabos") {
    const equipmentById = new Map(equipments.map((item) => [item.id, item]));
    const pointById = new Map(points.map((item) => [item.id, item]));

    const body = toCsv(
      ["numero", "cabo", "tipo", "andamento", "origem", "destino", "metros", "responsavel", "observacoes"],
      cables.map((cable) => {
        const from = cable.fromEquipmentId ? equipmentById.get(cable.fromEquipmentId) : undefined;
        const to = cable.toPointId ? pointById.get(cable.toPointId) : undefined;
        return [
          cable.number,
          cable.label ?? `Cabo ${cable.number}`,
          cable.kind ?? "",
          CABLE_STATUS[cable.status].label,
          from ? `E${from.number} · ${from.name}` : "",
          to ? `${to.number} · ${to.name}` : "",
          cable.lengthMeters ?? "",
          cable.owner ?? "",
          cable.notes ?? "",
        ];
      }),
    );
    return csvResponse(`${slug}-cabos.csv`, body);
  }

  return new Response(`Tipo inválido para ${event.name}`, { status: 400 });
}
