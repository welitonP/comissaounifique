"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  hashPassword,
  requireMaster,
  requireUser,
  verifyPassword,
} from "./auth";
import { SESSION_COOKIE, createSessionToken } from "./session";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const password = String(formData.get("password") || "").slice(0, 200);
  const next = String(formData.get("next") || "/");

  const user = username
    ? await prisma.user.findUnique({ where: { username } })
    : null;

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    // Atraso fixo em falha: inviabiliza tentativa de senhas em massa
    await new Promise((r) => setTimeout(r, 800));
    redirect("/login?erro=1");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

// ===== Gestão de membros (somente o master, dono do site) =====

export async function createUser(formData: FormData) {
  await requireMaster();
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
  const password = String(formData.get("password") || "");
  if (!name || !username || password.length < 4) {
    redirect("/admin/membros?erro=dados");
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    redirect("/admin/membros?erro=usuario");
  }
  // Todo novo usuário nasce como membro; o master é único.
  await prisma.user.create({
    data: { name, username, role: "member", passwordHash: hashPassword(password) },
  });
  revalidatePath("/admin/membros");
  redirect("/admin/membros?sucesso=1");
}

export async function resetUserPassword(formData: FormData) {
  await requireMaster();
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id || password.length < 4) return;
  const target = await prisma.user.findUnique({ where: { id } });
  // A senha do master só é trocada pelo próprio, em "Minha conta".
  if (!target || target.role === "master") return;
  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(password) },
  });
  revalidatePath("/admin/membros");
}

export async function toggleUserActive(formData: FormData) {
  const me = await requireMaster();
  const id = String(formData.get("id") || "");
  if (!id || me.id === id) return; // não desativar a si mesmo
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "master") return; // conta master é intocável
  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/admin/membros");
}

export async function deleteUser(formData: FormData) {
  const me = await requireMaster();
  const id = String(formData.get("id") || "");
  if (!id || me.id === id) return; // não excluir a si mesmo
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "master") return; // conta master é intocável
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/membros");
}

export async function changeOwnPassword(formData: FormData) {
  const me = await requireUser();
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  if (next.length < 4) redirect("/admin/conta?erro=curta");
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user || !verifyPassword(current, user.passwordHash)) {
    redirect("/admin/conta?erro=atual");
  }
  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: hashPassword(next) },
  });
  redirect("/admin/conta?sucesso=1");
}

export async function createTeam(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const modality = String(formData.get("modality") || "").trim();
  if (!name || !modality) return;
  await prisma.team.create({ data: { name, modality } });
  revalidatePath("/admin/times");
  revalidatePath("/classificacao");
  revalidatePath("/admin/jogos");
}

export async function deleteTeam(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.team.delete({ where: { id } });
  revalidatePath("/admin/times");
  revalidatePath("/classificacao");
  revalidatePath("/agenda");
}

export async function createChampionship(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const season = String(formData.get("season") || "").trim();
  if (!name || !season) return;
  await prisma.championship.create({ data: { name, season } });
  revalidatePath("/admin/jogos");
}

export async function createMatch(formData: FormData) {
  await requireUser();
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
  await requireUser();
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
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.match.delete({ where: { id } });
  revalidatePath("/agenda");
  revalidatePath("/classificacao");
  revalidatePath("/admin/jogos");
}

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB por foto
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // limite de upload por comunicado
// Formatos seguros (SVG fica de fora: pode carregar script)
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function createAnnouncement(formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return;

  // Fotos (opcionais)
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_PHOTOS) {
    redirect("/admin/comunicados?erro=muitas-fotos");
  }
  let total = 0;
  for (const f of files) {
    total += f.size;
    if (!ALLOWED_IMAGE_MIMES.has(f.type)) {
      redirect("/admin/comunicados?erro=foto-formato");
    }
    if (f.size > MAX_PHOTO_BYTES || total > MAX_TOTAL_BYTES) {
      redirect("/admin/comunicados?erro=foto-grande");
    }
  }

  const images = await Promise.all(
    files.map(async (f) => ({
      data: Buffer.from(await f.arrayBuffer()),
      mime: f.type,
    })),
  );

  await prisma.announcement.create({
    data: {
      title,
      body,
      images: images.length > 0 ? { create: images } : undefined,
    },
  });
  revalidatePath("/");
  revalidatePath("/comunicados");
  revalidatePath("/admin/comunicados");
  redirect("/admin/comunicados?sucesso=1");
}

export async function updateAnnouncement(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!id || !title || !body) return;

  // Imagens existentes marcadas para remover.
  const remover = formData.getAll("removeImage").map(String).filter(Boolean);

  // Novas fotos (opcionais) — já chegam redimensionadas pelo PhotoField.
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let total = 0;
  for (const f of files) {
    total += f.size;
    if (!ALLOWED_IMAGE_MIMES.has(f.type)) {
      redirect("/admin/comunicados?erro=foto-formato");
    }
    if (f.size > MAX_PHOTO_BYTES || total > MAX_TOTAL_BYTES) {
      redirect("/admin/comunicados?erro=foto-grande");
    }
  }

  const existentes = await prisma.announcementImage.count({ where: { announcementId: id } });
  if (existentes - remover.length + files.length > MAX_PHOTOS) {
    redirect("/admin/comunicados?erro=muitas-fotos");
  }

  const novas = await Promise.all(
    files.map(async (f) => ({
      announcementId: id,
      data: Buffer.from(await f.arrayBuffer()),
      mime: f.type,
    })),
  );

  await prisma.$transaction([
    prisma.announcement.update({ where: { id }, data: { title, body } }),
    ...(remover.length > 0
      ? [prisma.announcementImage.deleteMany({ where: { id: { in: remover }, announcementId: id } })]
      : []),
    ...(novas.length > 0 ? [prisma.announcementImage.createMany({ data: novas })] : []),
  ]);

  revalidatePath("/");
  revalidatePath("/comunicados");
  revalidatePath("/admin/comunicados");
  redirect("/admin/comunicados?sucesso=editado");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/comunicados");
  revalidatePath("/admin/comunicados");
}

// ===== Galeria de fotos =====

export async function addGalleryPhotos(formData: FormData) {
  await requireUser();
  const caption = String(formData.get("caption") || "").trim();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) redirect("/admin/fotos?erro=sem-foto");
  if (files.length > MAX_PHOTOS) redirect("/admin/fotos?erro=muitas-fotos");

  let total = 0;
  for (const f of files) {
    total += f.size;
    if (!ALLOWED_IMAGE_MIMES.has(f.type)) redirect("/admin/fotos?erro=foto-formato");
    if (f.size > MAX_PHOTO_BYTES || total > MAX_TOTAL_BYTES) {
      redirect("/admin/fotos?erro=foto-grande");
    }
  }

  const photos = await Promise.all(
    files.map(async (f) => ({
      caption: caption || null,
      data: Buffer.from(await f.arrayBuffer()),
      mime: f.type,
    })),
  );
  await prisma.galleryPhoto.createMany({ data: photos });
  revalidatePath("/fotos");
  revalidatePath("/admin/fotos");
  redirect("/admin/fotos?sucesso=1");
}

export async function deleteGalleryPhoto(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.galleryPhoto.delete({ where: { id } });
  revalidatePath("/fotos");
  revalidatePath("/admin/fotos");
}

export async function createPoll(formData: FormData) {
  await requireUser();
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

// Edita a enquete: pergunta, texto das opções (mantém os votos), remove
// opções e adiciona novas.
export async function updatePoll(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const question = String(formData.get("question") || "").trim();
  if (!id || !question) return;

  const removeSet = new Set(formData.getAll("removeOption").map(String));
  const optionIds = String(formData.get("optionIds") || "")
    .split(",")
    .filter(Boolean);
  const novas = String(formData.get("newOptions") || "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.poll.update({ where: { id }, data: { question } }),
  ];
  for (const oid of optionIds) {
    if (removeSet.has(oid)) {
      ops.push(prisma.pollOption.delete({ where: { id: oid } }));
    } else {
      const t = String(formData.get(`opt_${oid}`) || "").trim();
      if (t) ops.push(prisma.pollOption.update({ where: { id: oid }, data: { text: t } }));
    }
  }
  if (novas.length > 0) {
    ops.push(prisma.pollOption.createMany({ data: novas.map((text) => ({ pollId: id, text })) }));
  }
  await prisma.$transaction(ops);

  revalidatePath("/");
  revalidatePath("/enquetes");
  revalidatePath("/admin/enquetes");
  redirect("/admin/enquetes?enquete=salva");
}

export async function deletePoll(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.poll.delete({ where: { id } });
  revalidatePath("/enquetes");
  revalidatePath("/admin/enquetes");
}

// Pública: o atleta sugere uma modalidade que não está entre as opções.
export async function suggestPollModality(formData: FormData) {
  // De onde veio (home "/" ou "/enquetes"), para voltar ao mesmo lugar.
  const fromRaw = String(formData.get("from") || "/enquetes");
  const from = fromRaw.startsWith("/") ? fromRaw : "/enquetes";
  // honeypot anti-spam
  if (String(formData.get("website") || "")) {
    redirect(`${from}?sugestao=ok`);
  }
  const pollId = String(formData.get("pollId") || "");
  const text = String(formData.get("text") || "").trim().slice(0, 80);
  if (!pollId || text.length < 2) {
    redirect(`${from}?sugestao=curta`);
  }
  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { id: true } });
  if (!poll) redirect(from);
  await prisma.pollSuggestion.create({ data: { pollId, text } });
  revalidatePath("/admin/enquetes");
  redirect(`${from}?sugestao=ok`);
}

// Comissão corrige o texto de uma sugestão (ex: erro de digitação).
export async function updatePollSuggestion(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const text = String(formData.get("text") || "").trim().slice(0, 80);
  if (!id || text.length < 2) return;
  await prisma.pollSuggestion.update({ where: { id }, data: { text } });
  revalidatePath("/admin/enquetes");
}

export async function deletePollSuggestion(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.pollSuggestion.delete({ where: { id } });
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

  // A opção precisa pertencer mesmo a esta enquete (evita voto forjado).
  const option = await prisma.pollOption.findUnique({
    where: { id: optionId },
    select: { pollId: true },
  });
  if (!option || option.pollId !== pollId) {
    redirect("/enquetes");
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
  await requireUser();
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
  await requireUser();
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
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.modality.delete({ where: { id } });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
  revalidatePath("/calendario");
}

// ===== Entre Empresas: Inscritos =====

export async function createRegistration(formData: FormData) {
  await requireUser();
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
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.registration.delete({ where: { id } });
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
}

// ===== Calendário =====

export async function createCalendarEvent(formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  const modalityId = String(formData.get("modalityId") || "");
  const location = String(formData.get("location") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const { parseDataLocal } = await import("./datas");
  const quando = parseDataLocal(date);
  if (!title || !quando) return;
  await prisma.calendarEvent.create({
    data: {
      title,
      date: quando,
      modalityId: modalityId || null,
      location: location || null,
      description: description || null,
    },
  });
  revalidatePath("/calendario");
  revalidatePath("/admin/calendario");
}

export async function deleteCalendarEvent(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendario");
  revalidatePath("/admin/calendario");
}

// ===== Materiais (estoque) =====

export async function createMaterial(formData: FormData) {
  await requireUser();
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
  await requireUser();
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
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.material.delete({ where: { id } });
  revalidatePath("/materiais");
  revalidatePath("/admin/materiais");
}

// ===== Uniformes / itens controlados (quem está com o quê) =====

export async function createTrackedItem(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!name) return;
  await prisma.trackedItem.create({
    data: { name, category: category || null, notes: notes || null },
  });
  revalidatePath("/uniformes");
  revalidatePath("/admin/uniformes");
}

// Empresta o item para alguém (registra quem está com ele)
export async function lendTrackedItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const holderName = String(formData.get("holderName") || "").trim();
  if (!id || !holderName) return;
  await prisma.trackedItem.update({
    where: { id },
    data: { holderName, since: new Date() },
  });
  revalidatePath("/uniformes");
  revalidatePath("/admin/uniformes");
}

// Marca como devolvido (disponível na comissão)
export async function returnTrackedItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trackedItem.update({
    where: { id },
    data: { holderName: null, since: null },
  });
  revalidatePath("/uniformes");
  revalidatePath("/admin/uniformes");
}

export async function deleteTrackedItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trackedItem.delete({ where: { id } });
  revalidatePath("/uniformes");
  revalidatePath("/admin/uniformes");
}

// ===== Sugestões dos atletas =====

// Pública: qualquer atleta pode enviar (nome opcional).
export async function createSuggestion(formData: FormData) {
  // honeypot anti-spam: campo invisível que humanos não preenchem
  if (String(formData.get("website") || "")) {
    redirect("/sugestoes?sucesso=1");
  }
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const message = String(formData.get("message") || "").trim().slice(0, 2000);
  if (message.length < 5) {
    redirect("/sugestoes?erro=curta");
  }
  await prisma.suggestion.create({ data: { name: name || null, message } });
  revalidatePath("/admin/sugestoes");
  redirect("/sugestoes?sucesso=1");
}

export async function updateSuggestionStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["nova", "analise", "concluida"].includes(status)) return;
  await prisma.suggestion.update({ where: { id }, data: { status } });
  revalidatePath("/admin/sugestoes");
}

export async function deleteSuggestion(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.suggestion.delete({ where: { id } });
  revalidatePath("/admin/sugestoes");
}

// ===== Resultados / conquistas =====

export async function createResult(formData: FormData) {
  await requireUser();
  const event = String(formData.get("event") || "").trim();
  const modality = String(formData.get("modality") || "").trim();
  const placement = String(formData.get("placement") || "").trim();
  const medalRaw = String(formData.get("medal") || "");
  const medal = ["ouro", "prata", "bronze"].includes(medalRaw) ? medalRaw : null;
  const year = Number(formData.get("year") || new Date().getFullYear());
  const note = String(formData.get("note") || "").trim();
  if (!event || !modality || !placement) return;
  await prisma.result.create({
    data: {
      event,
      modality,
      placement,
      medal,
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      note: note || null,
    },
  });
  revalidatePath("/resultados");
  revalidatePath("/admin/resultados");
}

export async function deleteResult(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.result.delete({ where: { id } });
  revalidatePath("/resultados");
  revalidatePath("/admin/resultados");
}

// ===== Membros da comissão (vitrine "A Comissão") =====

export async function createCommissionMember(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const order = Number(formData.get("order") || 0);
  if (!name || !role) return;

  const photo = formData.get("photo");
  let photoData: Buffer | null = null;
  let photoMime: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_IMAGE_MIMES.has(photo.type) || photo.size > 2 * 1024 * 1024) {
      redirect("/admin/comissao?erro=foto");
    }
    photoData = Buffer.from(await photo.arrayBuffer());
    photoMime = photo.type;
  }

  await prisma.commissionMember.create({
    data: {
      name,
      role,
      whatsapp: whatsapp || null,
      order: Number.isFinite(order) ? order : 0,
      photoData,
      photoMime,
    },
  });
  revalidatePath("/comissao");
  revalidatePath("/admin/comissao");
  revalidatePath("/");
}

export async function updateCommissionMember(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const order = Number(formData.get("order") || 0);
  if (!name || !role) {
    redirect("/admin/comissao?erro=dados");
  }

  const data: {
    name: string;
    role: string;
    whatsapp: string | null;
    order: number;
    photoData?: Buffer;
    photoMime?: string;
  } = {
    name,
    role,
    whatsapp: whatsapp || null,
    order: Number.isFinite(order) ? order : 0,
  };

  // Foto é opcional: só troca se enviarem uma nova.
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_IMAGE_MIMES.has(photo.type) || photo.size > 2 * 1024 * 1024) {
      redirect("/admin/comissao?erro=foto");
    }
    data.photoData = Buffer.from(await photo.arrayBuffer());
    data.photoMime = photo.type;
  }

  await prisma.commissionMember.update({ where: { id }, data });
  revalidatePath("/comissao");
  revalidatePath("/admin/comissao");
  revalidatePath("/");
  redirect("/admin/comissao?sucesso=editado");
}

export async function deleteCommissionMember(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.commissionMember.delete({ where: { id } });
  revalidatePath("/comissao");
  revalidatePath("/admin/comissao");
}

// ===== Inscrições online =====

export async function toggleInscricoes(formData: FormData) {
  await requireUser();
  const abrir = String(formData.get("abrir") || "") === "1";
  const { setInscricoesAbertas } = await import("./settings");
  await setInscricoesAbertas(abrir);
  revalidatePath("/admin/inscricoes");
  revalidatePath("/inscricao");
  revalidatePath("/");
}


export async function createEnrollment(formData: FormData) {
  // honeypot anti-spam
  if (String(formData.get("website") || "")) {
    redirect("/inscricao?sucesso=1");
  }
  const { isInscricoesAbertas } = await import("./settings");
  if (!(await isInscricoesAbertas())) {
    redirect("/inscricao?erro=fechado");
  }
  const name = String(formData.get("name") || "").trim().slice(0, 100);
  const birthDate = String(formData.get("birthDate") || "").trim().slice(0, 10);
  const phone = String(formData.get("phone") || "").trim().slice(0, 30);
  const sector = String(formData.get("sector") || "").trim().slice(0, 100);
  const shirtSize = String(formData.get("shirtSize") || "").trim().slice(0, 10);
  const modalityIds = formData.getAll("modalidades").map(String).filter(Boolean);

  // Nome, nascimento, telefone, setor e camisa são obrigatórios.
  if (!name || !birthDate || !phone || !sector || !shirtSize || modalityIds.length === 0) {
    redirect("/inscricao?erro=dados");
  }

  const mods = await prisma.modality.findMany({
    where: { id: { in: modalityIds } },
    select: { id: true, name: true },
  });
  if (mods.length === 0) {
    redirect("/inscricao?erro=dados");
  }

  await prisma.enrollment.create({
    data: {
      name,
      birthDate,
      phone,
      sector,
      shirtSize,
      modalityIds: mods.map((m) => m.id).join(","),
      modalityNames: mods.map((m) => m.name).join(", "),
    },
  });
  revalidatePath("/admin/inscricoes");
  redirect("/inscricao?sucesso=1");
}

export async function approveEnrollment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const enr = await prisma.enrollment.findUnique({ where: { id } });
  if (!enr || enr.status !== "pendente") return;

  const ids = enr.modalityIds.split(",").filter(Boolean);
  const responsible =
    [
      enr.birthDate ? `Nasc. ${enr.birthDate.split("-").reverse().join("/")}` : "",
      enr.sector || "",
      enr.shirtSize ? `Camisa ${enr.shirtSize}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || null;
  const contato = enr.phone || enr.contact || null;

  // Cria a inscrição no elenco de cada modalidade escolhida
  await prisma.registration.createMany({
    data: ids.map((modalityId) => ({
      modalityId,
      companyName: enr.name,
      responsible,
      contact: contato,
    })),
  });

  await prisma.enrollment.update({ where: { id }, data: { status: "aprovada" } });
  revalidatePath("/admin/inscricoes");
  revalidatePath("/entre-empresas");
}

export async function rejectEnrollment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.enrollment.update({ where: { id }, data: { status: "recusada" } });
  revalidatePath("/admin/inscricoes");
}

export async function deleteEnrollment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.enrollment.delete({ where: { id } });
  revalidatePath("/admin/inscricoes");
}

// Nova temporada: limpa a fila de inscrições (pedidos pendentes/históricos).
export async function clearEnrollments() {
  await requireUser();
  await prisma.enrollment.deleteMany({});
  revalidatePath("/admin/inscricoes");
  redirect("/admin/inscricoes?limpou=inscricoes");
}

// Nova temporada: limpa o elenco atual (todos os atletas do Entre Empresas).
export async function clearElenco() {
  await requireUser();
  await prisma.registration.deleteMany({});
  revalidatePath("/entre-empresas");
  revalidatePath("/admin/entre-empresas");
  revalidatePath("/admin/inscricoes");
  redirect("/admin/inscricoes?limpou=elenco");
}

// ===== Confirmação de presença (RSVP) =====

export async function createRsvp(formData: FormData) {
  // honeypot anti-spam
  if (String(formData.get("website") || "")) {
    redirect("/calendario?rsvp=ok");
  }
  const eventId = String(formData.get("eventId") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const going = String(formData.get("going") || "1") === "1";
  if (!eventId || !name) {
    redirect("/calendario?rsvp=dados");
  }

  const store = await cookies();
  const cookieName = "rsvp_events";
  const done = (store.get(cookieName)?.value || "").split(",").filter(Boolean);
  if (done.includes(eventId)) {
    redirect(`/calendario?rsvp=ja#dia`);
  }

  await prisma.eventRsvp.create({ data: { eventId, name, going } });

  store.set(cookieName, [...done, eventId].join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/calendario");
  revalidatePath("/admin/presencas");
  redirect("/calendario?rsvp=ok");
}

export async function deleteRsvp(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.eventRsvp.delete({ where: { id } });
  revalidatePath("/admin/presencas");
}

// ===== Kits e saídas de equipamento =====

export async function createKit(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  const items = String(formData.get("items") || "").trim();
  if (!name || !items) return;
  await prisma.equipmentKit.create({ data: { name, items } });
  revalidatePath("/admin/saidas");
}

export async function deleteKit(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.equipmentKit.delete({ where: { id } });
  revalidatePath("/admin/saidas");
}

export async function createCheckout(formData: FormData) {
  await requireUser();
  const eventId = String(formData.get("eventId") || "");
  const manualTitle = String(formData.get("title") || "").trim();
  const manualDate = String(formData.get("date") || "");
  const responsible = String(formData.get("responsible") || "").trim();
  const kitId = String(formData.get("kitId") || "");

  const { parseDataLocal } = await import("./datas");
  let title = manualTitle;
  let date: Date | null = manualDate ? parseDataLocal(manualDate) : null;

  if (eventId) {
    const ev = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (ev) {
      title = ev.title;
      date = ev.date;
    }
  }
  if (!title || !date) {
    redirect("/admin/saidas?erro=dados");
  }

  let itemNames: string[] = [];
  if (kitId) {
    const kit = await prisma.equipmentKit.findUnique({ where: { id: kitId } });
    if (kit) {
      itemNames = kit.items
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  await prisma.checkout.create({
    data: {
      title,
      date,
      eventId: eventId || null,
      responsible: responsible || null,
      items: itemNames.length > 0 ? { create: itemNames.map((name) => ({ name })) } : undefined,
    },
  });
  revalidatePath("/admin/saidas");
  redirect("/admin/saidas?sucesso=1");
}

export async function addCheckoutItem(formData: FormData) {
  await requireUser();
  const checkoutId = String(formData.get("checkoutId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!checkoutId || !name) return;
  await prisma.checkoutItem.create({ data: { checkoutId, name } });
  revalidatePath("/admin/saidas");
}

export async function toggleCheckoutItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const field = String(formData.get("field") || ""); // "taken" | "returned"
  if (!id || !["taken", "returned"].includes(field)) return;
  const item = await prisma.checkoutItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.checkoutItem.update({
    where: { id },
    data: field === "taken" ? { taken: !item.taken } : { returned: !item.returned },
  });
  revalidatePath("/admin/saidas");
}

export async function deleteCheckoutItem(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.checkoutItem.delete({ where: { id } });
  revalidatePath("/admin/saidas");
}

export async function setCheckoutStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["aberto", "devolvido"].includes(status)) return;
  await prisma.checkout.update({ where: { id }, data: { status } });
  revalidatePath("/admin/saidas");
}

export async function deleteCheckout(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.checkout.delete({ where: { id } });
  revalidatePath("/admin/saidas");
}

// ===== Torneios internos (ex: Torneio de Truco, CS) =====

// Normaliza as perguntas extras (uma por linha, sem vazias).
function limparPerguntas(raw: string): string | null {
  const linhas = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10);
  return linhas.length > 0 ? linhas.join("\n") : null;
}

export async function createTournament(formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const dateRaw = String(formData.get("date") || "");
  const questions = limparPerguntas(String(formData.get("questions") || ""));
  if (!title) return;
  const { parseDataLocal } = await import("./datas");
  await prisma.tournament.create({
    data: {
      title,
      description: description || null,
      location: location || null,
      date: dateRaw ? parseDataLocal(dateRaw) : null,
      questions,
      open: true,
    },
  });
  revalidatePath("/torneios");
  revalidatePath("/admin/torneios");
  revalidatePath("/");
}

export async function updateTournament(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return;
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const dateRaw = String(formData.get("date") || "");
  const questions = limparPerguntas(String(formData.get("questions") || ""));
  const { parseDataLocal } = await import("./datas");
  await prisma.tournament.update({
    where: { id },
    data: {
      title,
      description: description || null,
      location: location || null,
      date: dateRaw ? parseDataLocal(dateRaw) : null,
      questions,
    },
  });
  revalidatePath("/torneios");
  revalidatePath("/admin/torneios");
  revalidatePath("/");
  redirect("/admin/torneios?ok=editado");
}

export async function toggleTournament(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const t = await prisma.tournament.findUnique({ where: { id }, select: { open: true } });
  if (!t) return;
  await prisma.tournament.update({ where: { id }, data: { open: !t.open } });
  revalidatePath("/torneios");
  revalidatePath("/admin/torneios");
  revalidatePath("/");
}

export async function deleteTournament(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.tournament.delete({ where: { id } });
  revalidatePath("/torneios");
  revalidatePath("/admin/torneios");
  revalidatePath("/");
}

// Pública: o atleta se inscreve num torneio interno (nome + WhatsApp).
export async function createTournamentSignup(formData: FormData) {
  // honeypot anti-spam
  if (String(formData.get("website") || "")) {
    redirect("/torneios?ok=1");
  }
  const tournamentId = String(formData.get("tournamentId") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 100);
  const phone = String(formData.get("phone") || "").trim().slice(0, 30);
  const note = String(formData.get("note") || "").trim().slice(0, 200);
  if (!tournamentId || !name || !phone) {
    redirect("/torneios?erro=dados");
  }
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { open: true, questions: true, signups: { select: { name: true, phone: true } } },
  });
  if (!t || !t.open) {
    redirect("/torneios?erro=fechado");
  }

  // Impede inscrição duplicada no mesmo torneio (mesmo nome ou mesmo telefone).
  const normNome = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const soDigitos = (s: string) => s.replace(/\D/g, "");
  const nomeAlvo = normNome(name);
  const foneAlvo = soDigitos(phone);
  const jaInscrito = t.signups.some(
    (s) => normNome(s.name) === nomeAlvo || (foneAlvo && soDigitos(s.phone) === foneAlvo),
  );
  if (jaInscrito) {
    redirect("/torneios?erro=ja-inscrito");
  }

  // Respostas às perguntas extras do torneio (todas opcionais).
  const perguntas = (t.questions || "").split("\n").map((p) => p.trim()).filter(Boolean);
  const respostas: Record<string, string> = {};
  perguntas.forEach((pergunta, i) => {
    const resp = String(formData.get(`q_${i}`) || "").trim().slice(0, 200);
    if (resp) respostas[pergunta] = resp;
  });
  const answers = Object.keys(respostas).length > 0 ? JSON.stringify(respostas) : null;

  await prisma.tournamentSignup.create({
    data: { tournamentId, name, phone, note: note || null, answers },
  });
  revalidatePath("/admin/torneios");
  redirect("/torneios?ok=1");
}

export async function deleteTournamentSignup(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.tournamentSignup.delete({ where: { id } });
  revalidatePath("/admin/torneios");
}

// ===== Grade de treinos (recorrentes) =====

export async function createTraining(formData: FormData) {
  await requireUser();
  const modality = String(formData.get("modality") || "").trim().slice(0, 60);
  const weekday = Number(formData.get("weekday"));
  const time = String(formData.get("time") || "").trim().slice(0, 5);
  const location = String(formData.get("location") || "").trim().slice(0, 120);
  const notes = String(formData.get("notes") || "").trim().slice(0, 200);
  if (!modality || !time || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) return;
  await prisma.training.create({
    data: { modality, weekday, time, location: location || null, notes: notes || null },
  });
  revalidatePath("/treinos");
  revalidatePath("/admin/treinos");
}

export async function deleteTraining(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.training.delete({ where: { id } });
  revalidatePath("/treinos");
  revalidatePath("/admin/treinos");
}

// Inscrição pública num treino da grade (nome obrigatório, WhatsApp opcional).
export async function createTrainingSignup(formData: FormData) {
  // honeypot anti-spam
  if (String(formData.get("website") || "")) {
    redirect("/treinos?ok=1");
  }
  const trainingId = String(formData.get("trainingId") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 100);
  const phone = String(formData.get("phone") || "").trim().slice(0, 30);
  if (!trainingId || !name) {
    redirect("/treinos?erro=dados");
  }
  const treino = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { id: true, signups: { select: { name: true, phone: true } } },
  });
  if (!treino) {
    redirect("/treinos?erro=dados");
  }

  // Impede a mesma pessoa de entrar duas vezes no mesmo treino (nome ou WhatsApp).
  const normNome = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const soDigitos = (s: string) => s.replace(/\D/g, "");
  const nomeAlvo = normNome(name);
  const foneAlvo = soDigitos(phone);
  const jaInscrito = treino.signups.some(
    (s) => normNome(s.name) === nomeAlvo || (foneAlvo && s.phone && soDigitos(s.phone) === foneAlvo),
  );
  if (jaInscrito) {
    redirect("/treinos?erro=ja-inscrito");
  }

  await prisma.trainingSignup.create({
    data: { trainingId, name, phone: phone || null },
  });
  revalidatePath("/treinos");
  revalidatePath("/admin/treinos");
  redirect("/treinos?ok=1");
}

export async function deleteTrainingSignup(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trainingSignup.delete({ where: { id } });
  revalidatePath("/treinos");
  revalidatePath("/admin/treinos");
}
