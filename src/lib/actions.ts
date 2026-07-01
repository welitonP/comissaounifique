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
