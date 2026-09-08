import type { CableStatus, EquipmentStatus, PointStatus } from "@prisma/client";

export const POINT_STATUS: Record<
  PointStatus,
  { label: string; hint: string; css: string }
> = {
  PENDING: { label: "Pendente", hint: "Cabo ainda não passado", css: "pending" },
  CABLED: { label: "Cabo passado", hint: "Aguardando ativação", css: "cabled" },
  ACTIVE: { label: "Ativo", hint: "AP instalado e em operação", css: "active" },
};

export const EQUIPMENT_STATUS: Record<
  EquipmentStatus,
  { label: string; hint: string; css: string }
> = {
  PLANNED: { label: "Planejado", hint: "Ainda não levado ao local", css: "planned" },
  INSTALLED: { label: "Instalado", hint: "No lugar, aguardando ativação", css: "installed" },
  ONLINE: { label: "Em operação", hint: "Ligado e respondendo", css: "online" },
};

export const CABLE_STATUS: Record<
  CableStatus,
  { label: string; hint: string; css: string }
> = {
  PLANNED: { label: "Planejado", hint: "Trajeto desenhado, cabo não passado", css: "planned" },
  LAID: { label: "Passado", hint: "Cabo lançado no trajeto", css: "laid" },
  TESTED: { label: "Testado", hint: "Cabo passado e certificado", css: "tested" },
};

export type Waypoint = { x: number; y: number };

/** Aceita o Json solto do Prisma e devolve só vértices válidos. */
export function parseWaypoints(value: unknown): Waypoint[] {
  if (!Array.isArray(value)) return [];
  const points: Waypoint[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { x, y } = item as Record<string, unknown>;
    if (typeof x !== "number" || typeof y !== "number") continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    points.push({ x: clampPercent(x), y: clampPercent(y) });
  }
  return points;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

export type EntityKind = "point" | "equipment" | "cable";

export const ENTITY_LABEL: Record<EntityKind, string> = {
  point: "AP",
  equipment: "Equipamento",
  cable: "Cabo",
};
