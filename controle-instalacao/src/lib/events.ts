import { prisma } from "@/lib/prisma";
import { parseWaypoints, type Waypoint } from "@/lib/types";
import type { Cable, Equipment, Event, MapPoint } from "@prisma/client";

export type EventSummary = {
  points: { total: number; pending: number; cabled: number; active: number; review: number };
  equipments: { total: number; online: number; installed: number; planned: number };
  cables: { total: number; laid: number; tested: number; done: number };
  activeRate: number;
  cabledRate: number;
};

export function summarize(
  points: Pick<MapPoint, "status" | "positionChecked">[],
  equipments: Pick<Equipment, "status">[],
  cables: Pick<Cable, "status">[],
): EventSummary {
  const total = points.length;
  const pending = points.filter((p) => p.status === "PENDING").length;
  const cabled = points.filter((p) => p.status === "CABLED").length;
  const active = points.filter((p) => p.status === "ACTIVE").length;
  const review = points.filter((p) => !p.positionChecked).length;

  const laid = cables.filter((c) => c.status === "LAID").length;
  const tested = cables.filter((c) => c.status === "TESTED").length;

  return {
    points: { total, pending, cabled, active, review },
    equipments: {
      total: equipments.length,
      online: equipments.filter((e) => e.status === "ONLINE").length,
      installed: equipments.filter((e) => e.status === "INSTALLED").length,
      planned: equipments.filter((e) => e.status === "PLANNED").length,
    },
    cables: { total: cables.length, laid, tested, done: laid + tested },
    activeRate: total ? Math.round((active / total) * 100) : 0,
    // "Cabo passado ou ativo": o que já tem infraestrutura no lugar.
    cabledRate: total ? Math.round(((cabled + active) / total) * 100) : 0,
  };
}

export type LoadedEvent = {
  event: Event;
  points: MapPoint[];
  equipments: Equipment[];
  cables: (Cable & { path: Waypoint[] })[];
  summary: EventSummary;
};

export async function loadEvent(slug: string): Promise<LoadedEvent | null> {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return null;

  const [points, equipments, rawCables] = await Promise.all([
    prisma.mapPoint.findMany({ where: { eventId: event.id }, orderBy: { number: "asc" } }),
    prisma.equipment.findMany({ where: { eventId: event.id }, orderBy: { number: "asc" } }),
    prisma.cable.findMany({ where: { eventId: event.id }, orderBy: { number: "asc" } }),
  ]);

  const cables = rawCables.map((cable) => ({ ...cable, path: parseWaypoints(cable.waypoints) }));

  return { event, points, equipments, cables, summary: summarize(points, equipments, cables) };
}

/** Próximo número livre — evita colidir com o índice único por evento. */
export async function nextNumber(
  eventId: string,
  entity: "point" | "equipment" | "cable",
): Promise<number> {
  const where = { eventId };
  const order = { number: "desc" } as const;

  const last =
    entity === "point"
      ? await prisma.mapPoint.findFirst({ where, orderBy: order, select: { number: true } })
      : entity === "equipment"
        ? await prisma.equipment.findFirst({ where, orderBy: order, select: { number: true } })
        : await prisma.cable.findFirst({ where, orderBy: order, select: { number: true } });

  return (last?.number ?? 0) + 1;
}
