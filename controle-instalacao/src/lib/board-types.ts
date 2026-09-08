import type { CableStatus, EquipmentStatus, PointStatus } from "@prisma/client";
import type { Waypoint } from "@/lib/types";

/** Formas planas passadas do servidor para o mapa (client component). */

export type BoardPoint = {
  id: string;
  number: number;
  name: string;
  sector: string | null;
  status: PointStatus;
  x: number;
  y: number;
  positionChecked: boolean;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

export type BoardEquipment = {
  id: string;
  number: number;
  name: string;
  sector: string | null;
  kind: string | null;
  status: EquipmentStatus;
  x: number;
  y: number;
  positionChecked: boolean;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

export type BoardCable = {
  id: string;
  number: number;
  label: string | null;
  kind: string | null;
  status: CableStatus;
  fromEquipmentId: string | null;
  toPointId: string | null;
  path: Waypoint[];
  lengthMeters: number | null;
  owner: string | null;
  notes: string | null;
  updatedAt: string;
};

export type BoardEvent = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  address: string | null;
  hasPlan: boolean;
  hasOriginal: boolean;
};

export type Selection =
  | { kind: "point"; id: string }
  | { kind: "equipment"; id: string }
  | { kind: "cable"; id: string }
  | { kind: "new-point" }
  | { kind: "new-equipment" }
  | null;
