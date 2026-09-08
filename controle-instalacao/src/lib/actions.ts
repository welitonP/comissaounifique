"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { endSession, hashPassword, requireAdmin, requireSession, startSession, verifyPassword } from "@/lib/auth";
import { clampPercent, parseWaypoints, type EntityKind, type Waypoint } from "@/lib/types";
import { nextNumber } from "@/lib/events";
import { slugify } from "@/lib/slug";
import { parseCsv } from "@/lib/csv";
import type { CableStatus, EquipmentStatus, PointStatus, Prisma } from "@prisma/client";

export type ActionState = { error?: string; ok?: string };

const MAX_PLAN_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

function text(form: FormData, key: string, max = 400): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(form: FormData, key: string, max = 400): string | null {
  const value = text(form, key, max);
  return value.length ? value : null;
}

function number(form: FormData, key: string, fallback = 0): number {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function percent(form: FormData, key: string): number {
  return clampPercent(number(form, key));
}

function boolean(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

function fail(error: unknown): ActionState {
  const message = error instanceof Error ? error.message : "Não foi possível concluir.";
  return { error: message };
}

// ------------------------------------------------------------------ login

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const username = text(form, "username", 60).toLowerCase();
  const password = text(form, "password", 200);
  if (!username || !password) return { error: "Informe usuário e senha." };

  const user = await prisma.user.findUnique({ where: { username } });
  // Mesmo texto para usuário inexistente e senha errada, para não revelar quem existe.
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Usuário ou senha incorretos." };
  }

  await startSession(user);
  const next = text(form, "next", 200);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}

// ----------------------------------------------------------------- evento

async function readPlan(form: FormData, field: string) {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_PLAN_BYTES) {
    throw new Error("A planta precisa ter no máximo 10 MB.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Use uma imagem PNG, JPG, WEBP ou AVIF para a planta.");
  }
  return {
    bytes: Buffer.from(await file.arrayBuffer()),
    mimeType: file.type,
  };
}

export async function createEventAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();

    const name = text(form, "name", 120);
    if (!name) return { error: "Dê um nome ao evento." };

    const base = slugify(text(form, "slug", 60) || name);
    if (!base) return { error: "Não consegui gerar um endereço a partir desse nome." };

    // Se o slug já existe, sufixa até achar um livre.
    let slug = base;
    for (let attempt = 2; await prisma.event.findUnique({ where: { slug } }); attempt += 1) {
      slug = `${base}-${attempt}`;
    }

    const plan = await readPlan(form, "plan");
    const cloneFrom = text(form, "cloneFrom", 40);

    const event = await prisma.event.create({
      data: {
        slug,
        name,
        city: optionalText(form, "city", 80),
        address: optionalText(form, "address", 200),
        startsAt: optionalDate(form, "startsAt"),
        endsAt: optionalDate(form, "endsAt"),
        notes: optionalText(form, "notes", 1000),
        planImage: plan?.bytes,
        planMimeType: plan?.mimeType,
      },
    });

    if (cloneFrom) await cloneEventContents(cloneFrom, event.id);

    revalidatePath("/");
    redirect(`/eventos/${slug}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return fail(error);
  }
}

/**
 * Copia pontos, equipamentos e cabos de um evento anterior. As posições vêm
 * juntas mas entram como "a conferir": a planta nova raramente é idêntica.
 */
async function cloneEventContents(sourceId: string, targetId: string): Promise<void> {
  const [points, equipments, cables] = await Promise.all([
    prisma.mapPoint.findMany({ where: { eventId: sourceId }, orderBy: { number: "asc" } }),
    prisma.equipment.findMany({ where: { eventId: sourceId }, orderBy: { number: "asc" } }),
    prisma.cable.findMany({ where: { eventId: sourceId }, orderBy: { number: "asc" } }),
  ]);

  const pointIdMap = new Map<string, string>();
  const equipmentIdMap = new Map<string, string>();

  for (const point of points) {
    const created = await prisma.mapPoint.create({
      data: {
        eventId: targetId,
        number: point.number,
        name: point.name,
        sector: point.sector,
        status: "PENDING",
        x: point.x,
        y: point.y,
        positionChecked: false,
        owner: point.owner,
        notes: point.notes,
      },
    });
    pointIdMap.set(point.id, created.id);
  }

  for (const equipment of equipments) {
    const created = await prisma.equipment.create({
      data: {
        eventId: targetId,
        number: equipment.number,
        name: equipment.name,
        sector: equipment.sector,
        kind: equipment.kind,
        status: "PLANNED",
        x: equipment.x,
        y: equipment.y,
        positionChecked: false,
        owner: equipment.owner,
        notes: equipment.notes,
      },
    });
    equipmentIdMap.set(equipment.id, created.id);
  }

  for (const cable of cables) {
    await prisma.cable.create({
      data: {
        eventId: targetId,
        number: cable.number,
        label: cable.label,
        kind: cable.kind,
        status: "PLANNED",
        fromEquipmentId: cable.fromEquipmentId ? equipmentIdMap.get(cable.fromEquipmentId) : null,
        toPointId: cable.toPointId ? pointIdMap.get(cable.toPointId) : null,
        waypoints: cable.waypoints as Prisma.InputJsonValue,
        lengthMeters: cable.lengthMeters,
        owner: cable.owner,
        notes: cable.notes,
      },
    });
  }
}

function optionalDate(form: FormData, key: string): Date | null {
  const value = text(form, key, 30);
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function updateEventAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const id = text(form, "id", 40);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return { error: "Evento não encontrado." };

    const plan = await readPlan(form, "plan");
    const original = await readPlan(form, "planOriginal");

    await prisma.event.update({
      where: { id },
      data: {
        name: text(form, "name", 120) || event.name,
        city: optionalText(form, "city", 80),
        address: optionalText(form, "address", 200),
        startsAt: optionalDate(form, "startsAt"),
        endsAt: optionalDate(form, "endsAt"),
        notes: optionalText(form, "notes", 1000),
        archived: boolean(form, "archived"),
        ...(plan ? { planImage: plan.bytes, planMimeType: plan.mimeType } : {}),
        ...(original
          ? { planOriginal: original.bytes, planOriginalMimeType: original.mimeType }
          : {}),
      },
    });

    revalidatePath("/");
    revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Evento atualizado." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEventAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id) await prisma.event.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

// ----------------------------------------------------------- histórico

async function record(
  eventId: string,
  entity: EntityKind,
  entityId: string,
  action: "create" | "update" | "delete",
  summary: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await prisma.changeLog.create({
    data: {
      eventId,
      entity,
      entityId,
      action,
      summary,
      author: (await requireSession()).name,
      before: (before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (after ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/** Tira o que não interessa no snapshot e deixa o JSON serializável. */
function snapshot<T extends Record<string, unknown>>(row: T | null): Record<string, unknown> | null {
  if (!row) return null;
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "createdAt" || key === "updatedAt") continue;
    copy[key] = value instanceof Date ? value.toISOString() : value;
  }
  return copy;
}

// --------------------------------------------------------------- pontos

export async function savePointAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();

    const eventId = text(form, "eventId", 40);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Evento não encontrado." };

    const id = text(form, "id", 40);
    const status = pointStatus(text(form, "status", 20));
    const desiredNumber = Math.trunc(number(form, "number", 0));

    const data = {
      name: text(form, "name", 120) || "Ponto sem nome",
      sector: optionalText(form, "sector", 80),
      status,
      x: percent(form, "x"),
      y: percent(form, "y"),
      positionChecked: boolean(form, "positionChecked"),
      owner: optionalText(form, "owner", 80),
      notes: optionalText(form, "notes", 1000),
    };

    if (id) {
      const before = await prisma.mapPoint.findFirst({ where: { id, eventId } });
      if (!before) return { error: "AP não encontrado." };

      const numberChanged = desiredNumber > 0 && desiredNumber !== before.number;
      if (numberChanged && (await numberTaken(eventId, "point", desiredNumber, id))) {
        return { error: `Já existe um AP com o número ${desiredNumber}.` };
      }

      const after = await prisma.mapPoint.update({
        where: { id },
        data: { ...data, ...(numberChanged ? { number: desiredNumber } : {}) },
      });
      await record(eventId, "point", id, "update", `AP ${after.number} — ${after.name}`, snapshot(before), snapshot(after));
    } else {
      const numberToUse = desiredNumber > 0 ? desiredNumber : await nextNumber(eventId, "point");
      if (await numberTaken(eventId, "point", numberToUse, null)) {
        return { error: `Já existe um AP com o número ${numberToUse}.` };
      }
      const created = await prisma.mapPoint.create({ data: { ...data, eventId, number: numberToUse } });
      await record(eventId, "point", created.id, "create", `AP ${created.number} — ${created.name}`, null, snapshot(created));
    }

    revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Ponto salvo." };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePointAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const id = text(form, "id", 40);
    const before = await prisma.mapPoint.findFirst({ where: { id, eventId } });
    if (!before) return { error: "AP não encontrado." };

    await prisma.mapPoint.delete({ where: { id } });
    await record(eventId, "point", id, "delete", `AP ${before.number} — ${before.name}`, snapshot(before), null);

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (event) revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Ponto excluído." };
  } catch (error) {
    return fail(error);
  }
}

// --------------------------------------------------------- equipamentos

export async function saveEquipmentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Evento não encontrado." };

    const id = text(form, "id", 40);
    const desiredNumber = Math.trunc(number(form, "number", 0));

    const data = {
      name: text(form, "name", 120) || "Equipamento sem nome",
      sector: optionalText(form, "sector", 80),
      kind: optionalText(form, "kind", 120),
      status: equipmentStatus(text(form, "status", 20)),
      x: percent(form, "x"),
      y: percent(form, "y"),
      positionChecked: boolean(form, "positionChecked"),
      owner: optionalText(form, "owner", 80),
      notes: optionalText(form, "notes", 1000),
    };

    if (id) {
      const before = await prisma.equipment.findFirst({ where: { id, eventId } });
      if (!before) return { error: "Equipamento não encontrado." };

      const numberChanged = desiredNumber > 0 && desiredNumber !== before.number;
      if (numberChanged && (await numberTaken(eventId, "equipment", desiredNumber, id))) {
        return { error: `Já existe um equipamento E${desiredNumber}.` };
      }

      const after = await prisma.equipment.update({
        where: { id },
        data: { ...data, ...(numberChanged ? { number: desiredNumber } : {}) },
      });
      await record(eventId, "equipment", id, "update", `E${after.number} — ${after.name}`, snapshot(before), snapshot(after));
    } else {
      const numberToUse = desiredNumber > 0 ? desiredNumber : await nextNumber(eventId, "equipment");
      if (await numberTaken(eventId, "equipment", numberToUse, null)) {
        return { error: `Já existe um equipamento E${numberToUse}.` };
      }
      const created = await prisma.equipment.create({ data: { ...data, eventId, number: numberToUse } });
      await record(eventId, "equipment", created.id, "create", `E${created.number} — ${created.name}`, null, snapshot(created));
    }

    revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Equipamento salvo." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEquipmentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const id = text(form, "id", 40);
    const before = await prisma.equipment.findFirst({ where: { id, eventId } });
    if (!before) return { error: "Equipamento não encontrado." };

    await prisma.equipment.delete({ where: { id } });
    await record(eventId, "equipment", id, "delete", `E${before.number} — ${before.name}`, snapshot(before), null);

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (event) revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Equipamento excluído." };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------- cabos

export async function saveCableAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Evento não encontrado." };

    const id = text(form, "id", 40);
    const desiredNumber = Math.trunc(number(form, "number", 0));
    const waypoints = readWaypoints(form);

    const data = {
      label: optionalText(form, "label", 120),
      kind: optionalText(form, "kind", 80),
      status: cableStatus(text(form, "status", 20)),
      fromEquipmentId: optionalText(form, "fromEquipmentId", 40),
      toPointId: optionalText(form, "toPointId", 40),
      waypoints: waypoints as unknown as Prisma.InputJsonValue,
      lengthMeters: form.get("lengthMeters") ? number(form, "lengthMeters") : null,
      owner: optionalText(form, "owner", 80),
      notes: optionalText(form, "notes", 1000),
    };

    if (id) {
      const before = await prisma.cable.findFirst({ where: { id, eventId } });
      if (!before) return { error: "Cabo não encontrado." };

      const numberChanged = desiredNumber > 0 && desiredNumber !== before.number;
      if (numberChanged && (await numberTaken(eventId, "cable", desiredNumber, id))) {
        return { error: `Já existe um cabo com o número ${desiredNumber}.` };
      }

      const after = await prisma.cable.update({
        where: { id },
        data: { ...data, ...(numberChanged ? { number: desiredNumber } : {}) },
      });
      await record(eventId, "cable", id, "update", `Cabo ${after.number}`, snapshot(before), snapshot(after));
    } else {
      const numberToUse = desiredNumber > 0 ? desiredNumber : await nextNumber(eventId, "cable");
      if (await numberTaken(eventId, "cable", numberToUse, null)) {
        return { error: `Já existe um cabo com o número ${numberToUse}.` };
      }
      const created = await prisma.cable.create({ data: { ...data, eventId, number: numberToUse } });
      await record(eventId, "cable", created.id, "create", `Cabo ${created.number}`, null, snapshot(created));
    }

    revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Cabo salvo." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCableAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const id = text(form, "id", 40);
    const before = await prisma.cable.findFirst({ where: { id, eventId } });
    if (!before) return { error: "Cabo não encontrado." };

    await prisma.cable.delete({ where: { id } });
    await record(eventId, "cable", id, "delete", `Cabo ${before.number}`, snapshot(before), null);

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (event) revalidatePath(`/eventos/${event.slug}`);
    return { ok: "Cabo excluído." };
  } catch (error) {
    return fail(error);
  }
}

function readWaypoints(form: FormData): Waypoint[] {
  const raw = form.get("waypoints");
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    return parseWaypoints(JSON.parse(raw)).slice(0, 200);
  } catch {
    return [];
  }
}

// -------------------------------------------------------------- desfazer

export async function undoLastChangeAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);

    const change = await prisma.changeLog.findFirst({
      where: { eventId, undone: false },
      orderBy: { createdAt: "desc" },
    });
    if (!change) return { error: "Não há alteração recente para desfazer." };

    const before = change.before as Record<string, unknown> | null;

    if (change.action === "create") {
      await removeEntity(change.entity as EntityKind, change.entityId);
    } else if (change.action === "delete" && before) {
      await restoreEntity(change.entity as EntityKind, before);
    } else if (change.action === "update" && before) {
      await restoreEntity(change.entity as EntityKind, before);
    }

    await prisma.changeLog.update({ where: { id: change.id }, data: { undone: true } });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { slug: true } });
    if (event) revalidatePath(`/eventos/${event.slug}`);
    return { ok: `Desfeito: ${change.summary}` };
  } catch (error) {
    return fail(error);
  }
}

async function removeEntity(entity: EntityKind, id: string): Promise<void> {
  if (entity === "point") await prisma.mapPoint.deleteMany({ where: { id } });
  else if (entity === "equipment") await prisma.equipment.deleteMany({ where: { id } });
  else await prisma.cable.deleteMany({ where: { id } });
}

/** Recria (ou reescreve) a linha a partir do snapshot guardado no histórico. */
async function restoreEntity(entity: EntityKind, data: Record<string, unknown>): Promise<void> {
  const id = String(data.id ?? "");
  if (!id) return;

  if (entity === "point") {
    const payload = {
      eventId: String(data.eventId),
      number: Number(data.number),
      name: String(data.name ?? ""),
      sector: (data.sector as string | null) ?? null,
      status: pointStatus(String(data.status ?? "PENDING")),
      x: clampPercent(Number(data.x)),
      y: clampPercent(Number(data.y)),
      positionChecked: Boolean(data.positionChecked),
      owner: (data.owner as string | null) ?? null,
      notes: (data.notes as string | null) ?? null,
    };
    await prisma.mapPoint.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  } else if (entity === "equipment") {
    const payload = {
      eventId: String(data.eventId),
      number: Number(data.number),
      name: String(data.name ?? ""),
      sector: (data.sector as string | null) ?? null,
      kind: (data.kind as string | null) ?? null,
      status: equipmentStatus(String(data.status ?? "PLANNED")),
      x: clampPercent(Number(data.x)),
      y: clampPercent(Number(data.y)),
      positionChecked: Boolean(data.positionChecked),
      owner: (data.owner as string | null) ?? null,
      notes: (data.notes as string | null) ?? null,
    };
    await prisma.equipment.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  } else {
    const payload = {
      eventId: String(data.eventId),
      number: Number(data.number),
      label: (data.label as string | null) ?? null,
      kind: (data.kind as string | null) ?? null,
      status: cableStatus(String(data.status ?? "PLANNED")),
      fromEquipmentId: (data.fromEquipmentId as string | null) ?? null,
      toPointId: (data.toPointId as string | null) ?? null,
      waypoints: parseWaypoints(data.waypoints) as unknown as Prisma.InputJsonValue,
      lengthMeters: data.lengthMeters === null ? null : Number(data.lengthMeters),
      owner: (data.owner as string | null) ?? null,
      notes: (data.notes as string | null) ?? null,
    };
    await prisma.cable.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }
}

// ------------------------------------------------------------ importação

export async function importCsvAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
    const eventId = text(form, "eventId", 40);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { error: "Evento não encontrado." };

    const kind = text(form, "kind", 20) as EntityKind;
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return { error: "Escolha um arquivo CSV." };
    if (file.size > 2 * 1024 * 1024) return { error: "O CSV precisa ter no máximo 2 MB." };

    const { rows } = parseCsv(await file.text());
    if (!rows.length) return { error: "O arquivo não tem linhas de dados." };

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const num = Math.trunc(Number(row.numero));
      if (!Number.isFinite(num) || num <= 0) continue;

      if (kind === "point") {
        const payload = {
          name: row.nome || row.ponto || `Ponto ${num}`,
          sector: row.setor || null,
          status: pointStatus(row.situacao),
          x: clampPercent(Number(row.x)),
          y: clampPercent(Number(row.y)),
          positionChecked: /conferid/i.test(row.posicao ?? ""),
          owner: row.responsavel || null,
          notes: row.observacoes || null,
        };
        const existing = await prisma.mapPoint.findUnique({
          where: { eventId_number: { eventId, number: num } },
        });
        if (existing) {
          await prisma.mapPoint.update({ where: { id: existing.id }, data: payload });
          updated += 1;
        } else {
          await prisma.mapPoint.create({ data: { ...payload, eventId, number: num } });
          created += 1;
        }
      } else if (kind === "equipment") {
        const payload = {
          name: row.nome || row.equipamento || `Equipamento ${num}`,
          sector: row.setor || null,
          kind: row.tipo || row.modelo || null,
          status: equipmentStatus(row.situacao),
          x: clampPercent(Number(row.x)),
          y: clampPercent(Number(row.y)),
          positionChecked: /conferid/i.test(row.posicao ?? ""),
          owner: row.responsavel || null,
          notes: row.observacoes || null,
        };
        const existing = await prisma.equipment.findUnique({
          where: { eventId_number: { eventId, number: num } },
        });
        if (existing) {
          await prisma.equipment.update({ where: { id: existing.id }, data: payload });
          updated += 1;
        } else {
          await prisma.equipment.create({ data: { ...payload, eventId, number: num } });
          created += 1;
        }
      } else {
        const payload = {
          label: row.cabo || row.nome || null,
          kind: row.tipo || null,
          status: cableStatus(row.andamento || row.situacao),
          owner: row.responsavel || null,
          notes: row.observacoes || row.desvios || null,
        };
        const existing = await prisma.cable.findUnique({
          where: { eventId_number: { eventId, number: num } },
        });
        if (existing) {
          await prisma.cable.update({ where: { id: existing.id }, data: payload });
          updated += 1;
        } else {
          await prisma.cable.create({ data: { ...payload, eventId, number: num, waypoints: [] } });
          created += 1;
        }
      }
    }

    revalidatePath(`/eventos/${event.slug}`);
    return { ok: `Importação concluída: ${created} criados, ${updated} atualizados.` };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------- conversão

function pointStatus(value: string): PointStatus {
  const key = value.toUpperCase();
  if (key === "ACTIVE" || /ativ/i.test(value)) return "ACTIVE";
  if (key === "CABLED" || /cabo/i.test(value)) return "CABLED";
  return "PENDING";
}

function equipmentStatus(value: string): EquipmentStatus {
  const key = value.toUpperCase();
  if (key === "ONLINE" || /opera/i.test(value)) return "ONLINE";
  if (key === "INSTALLED" || /instal/i.test(value)) return "INSTALLED";
  return "PLANNED";
}

function cableStatus(value: string): CableStatus {
  const key = value.toUpperCase();
  if (key === "TESTED" || /test/i.test(value)) return "TESTED";
  if (key === "LAID" || /passad/i.test(value)) return "LAID";
  return "PLANNED";
}

async function numberTaken(
  eventId: string,
  entity: EntityKind,
  value: number,
  ignoreId: string | null,
): Promise<boolean> {
  const where = { eventId, number: value, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) };
  const found =
    entity === "point"
      ? await prisma.mapPoint.findFirst({ where, select: { id: true } })
      : entity === "equipment"
        ? await prisma.equipment.findFirst({ where, select: { id: true } })
        : await prisma.cable.findFirst({ where, select: { id: true } });
  return Boolean(found);
}

// --------------------------------------------------------------- membros

export async function createUserAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const username = text(form, "username", 60).toLowerCase().replace(/\s+/g, "");
    const name = text(form, "name", 80);
    const password = text(form, "password", 200);

    if (!username || !name) return { error: "Informe usuário e nome." };
    if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
    if (await prisma.user.findUnique({ where: { username } })) {
      return { error: "Esse usuário já existe." };
    }

    await prisma.user.create({
      data: {
        username,
        name,
        passwordHash: await hashPassword(password),
        role: text(form, "role", 10) === "admin" ? "admin" : "member",
      },
    });

    revalidatePath("/membros");
    return { ok: `Membro ${name} criado.` };
  } catch (error) {
    return fail(error);
  }
}

export async function setUserPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const session = await requireSession();
    const id = text(form, "id", 40) || session.userId;
    if (id !== session.userId) await requireAdmin();

    const password = text(form, "password", 200);
    if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

    await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
    revalidatePath("/membros");
    return { ok: "Senha atualizada." };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleUserAction(form: FormData): Promise<void> {
  const session = await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!id || id === session.userId) return;
  const user = await prisma.user.findUnique({ where: { id } });
  if (user) await prisma.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/membros");
}
