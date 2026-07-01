"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { ADMIN_SESSION_COOKIE, createSessionToken, isAdminLoggedIn, isAdminPassword } from "./auth";

async function requireAdmin() {
  const ok = await isAdminLoggedIn();
  if (!ok) {
    throw new Error("Não autorizado.");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!isAdminPassword(password)) {
    redirect("/admin/login?erro=1");
  }
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "").trim();
  if (!name || !modality) return;
  await prisma.team.create({ data: { name, modality } });
  revalidatePath("/admin/times");
  revalidatePath("/classificacao");
  revalidatePath("/admin/jogos");
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/times");
  revalidatePath("/classificacao");
  revalidatePath("/agenda");
}

export async function createChampionship(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const season = String(formData.get("season") || "").trim();
  if (!name || !season) return;
  await prisma.championship.create({ data: { name, season } });
  revalidatePath("/admin/jogos");
}

export async function createMatch(formData: FormData) {
  await requireAdmin();
  const homeTeamId = String(formData.get("homeTeamId") || "");
  const awayTeamId = String(formData.get("awayTeamId") || "");
  const date = String(formData.get("date") || "");
  const location = String(formData.get("location") || "").trim();
  const championshipId = String(formData.get("championshipId") || "");
  if (!homeTeamId || !awayTeamId || !date || homeTeamId === awayTeamId) return;
  await prisma.match.create({
    data: {
      homeTeamId,
      awayTeamId,
      date: new Date(date),
      location: location || null,
      championshipId: championshipId || null,
    },
  });
  revalidatePath("/agenda");
  revalidatePath("/admin/jogos");
}

export async function updateMatchResult(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const homeScoreRaw = String(formData.get("homeScore") || "");
  const awayScoreRaw = String(formData.get("awayScore") || "");
  const homeScore = homeScoreRaw === "" ? null : Number(homeScoreRaw);
  const awayScore = awayScoreRaw === "" ? null : Number(awayScoreRaw);
  const status = homeScore !== null && awayScore !== null ? "finished" : "scheduled";
  await prisma.match.update({
    where: { id },
    data: { homeScore, awayScore, status },
  });
  revalidatePath("/agenda");
  revalidatePath("/classificacao");
  revalidatePath("/admin/jogos");
}

export async function deleteMatch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.match.delete({ where: { id } });
  revalidatePath("/agenda");
  revalidatePath("/classificacao");
  revalidatePath("/admin/jogos");
}

export async function createAnnouncement(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;
  await prisma.announcement.create({ data: { title, body } });
  revalidatePath("/comunicados");
  revalidatePath("/admin/comunicados");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/comunicados");
  revalidatePath("/admin/comunicados");
}

export async function createPoll(formData: FormData) {
  await requireAdmin();
  const question = String(formData.get("question") || "").trim();
  const optionsRaw = String(formData.get("options") || "");
  const options = optionsRaw
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!question || options.length < 2) return;
  await prisma.poll.create({
    data: { question, options: { create: options.map((text) => ({ text })) } },
  });
  revalidatePath("/enquetes");
  revalidatePath("/admin/enquetes");
}

export async function deletePoll(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.poll.delete({ where: { id } });
  revalidatePath("/enquetes");
  revalidatePath("/admin/enquetes");
}

export async function votePoll(formData: FormData) {
  const optionId = String(formData.get("optionId") || "");
  const pollId = String(formData.get("pollId") || "");
  if (!optionId || !pollId) return;

  const store = await cookies();
  const votedCookie = store.get("voted_polls")?.value ?? "";
  const votedPolls = votedCookie ? votedCookie.split(",").filter(Boolean) : [];
  if (votedPolls.includes(pollId)) {
    redirect("/enquetes?erro=ja-votou");
  }

  await prisma.pollOption.update({
    where: { id: optionId },
    data: { votes: { increment: 1 } },
  });

  store.set("voted_polls", [...votedPolls, pollId].join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/enquetes");
  redirect("/enquetes?sucesso=voto-registrado");
}

// ===== Entre Empresas: Modalidades =====

export async function createModality(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const info = String(formData.get("info") || "").trim();
  const order = Number(formData.get("order") || 0);
  if (!name) return;
  await prisma.modality.create({
    data: {
      name,
      description: description || null,
      info: info || null,
      order: Number.isFinite(order) ? order : 0,
    },
  });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
}

export async function updateModality(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const info = String(formData.get("info") || "").trim();
  const order = Number(formData.get("order") || 0);
  if (!name) return;
  await prisma.modality.update({
    where: { id },
    data: {
      name,
      description: description || null,
      info: info || null,
      order: Number.isFinite(order) ? order : 0,
    },
  });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
}

export async function deleteModality(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.modality.delete({ where: { id } });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
  revalidatePath("/calendario");
}

// ===== Entre Empresas: Inscritos =====

export async function createRegistration(formData: FormData) {
  await requireAdmin();
  const modalityId = String(formData.get("modalityId") || "");
  const companyName = String(formData.get("companyName") || "").trim();
  const responsible = String(formData.get("responsible") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  if (!modalityId || !companyName) return;
  await prisma.registration.create({
    data: {
      modalityId,
      companyName,
      responsible: responsible || null,
      contact: contact || null,
    },
  });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
}

export async function deleteRegistration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.registration.delete({ where: { id } });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
}

// ===== Calendário =====

export async function createCalendarEvent(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  const modalityId = String(formData.get("modalityId") || "");
  const location = String(formData.get("location") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title || !date) return;
  await prisma.calendarEvent.create({
    data: {
      title,
      date: new Date(date),
      modalityId: modalityId || null,
      location: location || null,
      description: description || null,
    },
  });
  revalidatePath("/calendario");
  revalidatePath("/admin/calendario");
}

export async function deleteCalendarEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendario");
  revalidatePath("/admin/calendario");
}

// ===== Materiais (estoque) =====

export async function createMaterial(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const quantity = Number(formData.get("quantity") || 0);
  const notes = String(formData.get("notes") || "").trim();
  if (!name) return;
  await prisma.material.create({
    data: {
      name,
      category: category || null,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      notes: notes || null,
    },
  });
  revalidatePath("/materiais");
  revalidatePath("/admin/materiais");
}

export async function updateMaterialQuantity(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const quantity = Number(formData.get("quantity") || 0);
  if (!id) return;
  await prisma.material.update({
    where: { id },
    data: { quantity: Number.isFinite(quantity) ? quantity : 0 },
  });
  revalidatePath("/materiais");
  revalidatePath("/admin/materiais");
}

export async function deleteMaterial(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.material.delete({ where: { id } });
  revalidatePath("/materiais");
  revalidatePath("/admin/materiais");
}
