"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { conferirSenha, hashSenha } from "./senha";
import { exigirDono, exigirUsuario, ehDono } from "./auth";
import { SESSION_COOKIE, createSessionToken } from "./session";
import { continuaLivre } from "./agenda";
import { parseInputLocal, diaISO } from "./datas";
import { precoParaCentavos, soDigitos, telefoneValido } from "./formato";
import { CONFIG_ID } from "./config";

function texto(fd: FormData, campo: string, max = 200): string {
  return String(fd.get(campo) || "").trim().slice(0, max);
}

function numero(fd: FormData, campo: string, padrao: number): number {
  const n = Number(String(fd.get(campo) || ""));
  return Number.isFinite(n) ? n : padrao;
}

function atualizarTudo() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

// ===== Entrar e sair =====

export async function loginAction(formData: FormData) {
  const usuario = texto(formData, "usuario", 100).toLowerCase();
  const senha = String(formData.get("senha") || "").slice(0, 200);
  const proximo = texto(formData, "proximo", 200);

  const u = usuario ? await prisma.usuario.findUnique({ where: { usuario } }) : null;

  if (!u || !u.ativo || !conferirSenha(senha, u.senhaHash)) {
    // Atraso fixo em falha: inviabiliza tentativa de senhas em massa.
    await new Promise((r) => setTimeout(r, 800));
    redirect("/login?erro=1");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(u.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(proximo.startsWith("/admin") ? proximo : "/admin");
}

export async function sairAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

// ===== Agenda do dia =====

// O barbeiro comum só mexe nos próprios atendimentos; o dono mexe em todos.
async function exigirAcessoAoAgendamento(agendamentoId: string) {
  const u = await exigirUsuario();
  const a = await prisma.agendamento.findUnique({ where: { id: agendamentoId } });
  if (!a) throw new Error("Agendamento não encontrado.");
  if (!ehDono(u.papel) && a.profissionalId !== u.profissionalId) {
    throw new Error("Você só pode alterar a sua própria agenda.");
  }
  return a;
}

export async function mudarStatusAction(formData: FormData) {
  const id = texto(formData, "id", 50);
  const status = texto(formData, "status", 20);
  if (!["agendado", "concluido", "cancelado", "faltou"].includes(status)) {
    throw new Error("Status inválido.");
  }
  await exigirAcessoAoAgendamento(id);
  await prisma.agendamento.update({ where: { id }, data: { status } });
  atualizarTudo();
}

// Encaixe manual, feito no balcão ou pelo telefone.
export async function criarAgendamentoAction(formData: FormData) {
  const u = await exigirUsuario();

  const nome = texto(formData, "nome", 120);
  const telefone = soDigitos(texto(formData, "telefone", 30));
  const servicoId = texto(formData, "servico", 50);
  const profissionalId = ehDono(u.papel)
    ? texto(formData, "profissional", 50)
    : u.profissionalId || "";
  const inicio = parseInputLocal(texto(formData, "inicio", 30));
  const observacao = texto(formData, "observacao", 300) || null;
  const forcar = formData.get("forcar") === "on";

  function voltar(erro: string): never {
    redirect(`/admin/novo?erro=${encodeURIComponent(erro)}`);
  }

  if (nome.length < 2) voltar("Informe o nome do cliente.");
  if (!telefoneValido(telefone)) voltar("Telefone inválido (DDD + número).");
  if (!servicoId || !profissionalId || !inicio) voltar("Preencha serviço, profissional e horário.");

  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico) voltar("Serviço não encontrado.");

  const fim = new Date(inicio.getTime() + servico.duracaoMin * 60000);

  if (!forcar && !(await continuaLivre(profissionalId, inicio, fim))) {
    voltar("Esse horário já está ocupado. Marque 'encaixar mesmo assim' se for proposital.");
  }

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    create: { nome, telefone },
    update: { nome },
  });

  await prisma.agendamento.create({
    data: {
      clienteId: cliente.id,
      profissionalId,
      servicoId,
      inicio,
      fim,
      precoCentavos: servico.precoCentavos,
      observacao,
      origem: "balcao",
      status: "agendado",
    },
  });

  atualizarTudo();
  redirect(`/admin?dia=${diaISO(inicio)}`);
}

// ===== Serviços =====

export async function salvarServicoAction(formData: FormData) {
  await exigirDono();
  const id = texto(formData, "id", 50);
  const dados = {
    nome: texto(formData, "nome", 100),
    descricao: texto(formData, "descricao", 300) || null,
    precoCentavos: precoParaCentavos(texto(formData, "preco", 20)),
    duracaoMin: Math.max(5, Math.min(480, numero(formData, "duracao", 30))),
    destaque: formData.get("destaque") === "on",
    ordem: numero(formData, "ordem", 0),
  };
  if (!dados.nome) throw new Error("O serviço precisa de um nome.");

  if (id) {
    await prisma.servico.update({ where: { id }, data: dados });
  } else {
    const novo = await prisma.servico.create({ data: dados });
    // Serviço novo já nasce liberado para todos os profissionais ativos.
    const profs = await prisma.profissional.findMany({
      where: { ativo: true },
      select: { id: true },
    });
    await prisma.servicoProfissional.createMany({
      data: profs.map((p) => ({ servicoId: novo.id, profissionalId: p.id })),
    });
  }
  atualizarTudo();
}

export async function alternarServicoAction(formData: FormData) {
  await exigirDono();
  const id = texto(formData, "id", 50);
  const s = await prisma.servico.findUnique({ where: { id } });
  if (!s) return;
  await prisma.servico.update({ where: { id }, data: { ativo: !s.ativo } });
  atualizarTudo();
}

// ===== Profissionais =====

export async function salvarProfissionalAction(formData: FormData) {
  await exigirDono();
  const id = texto(formData, "id", 50);
  const dados = {
    nome: texto(formData, "nome", 120),
    apelido: texto(formData, "apelido", 40) || null,
    bio: texto(formData, "bio", 300) || null,
    ordem: numero(formData, "ordem", 0),
  };
  if (!dados.nome) throw new Error("O profissional precisa de um nome.");

  if (id) {
    await prisma.profissional.update({ where: { id }, data: dados });
  } else {
    const novo = await prisma.profissional.create({ data: dados });
    // Começa atendendo todos os serviços ativos; o dono ajusta depois.
    const servicos = await prisma.servico.findMany({
      where: { ativo: true },
      select: { id: true },
    });
    await prisma.servicoProfissional.createMany({
      data: servicos.map((s) => ({ servicoId: s.id, profissionalId: novo.id })),
    });
  }
  atualizarTudo();
}

export async function alternarProfissionalAction(formData: FormData) {
  await exigirDono();
  const id = texto(formData, "id", 50);
  const p = await prisma.profissional.findUnique({ where: { id } });
  if (!p) return;
  await prisma.profissional.update({ where: { id }, data: { ativo: !p.ativo } });
  atualizarTudo();
}

// Expediente da semana: chegam 7 blocos (um por dia).
export async function salvarExpedienteAction(formData: FormData) {
  await exigirDono();
  const profissionalId = texto(formData, "profissional", 50);
  if (!profissionalId) throw new Error("Profissional não informado.");

  const linhas: {
    profissionalId: string;
    diaSemana: number;
    inicio: string;
    fim: string;
    pausaInicio: string | null;
    pausaFim: string | null;
  }[] = [];

  for (let dia = 0; dia < 7; dia++) {
    if (formData.get(`ativo_${dia}`) !== "on") continue;
    const inicio = texto(formData, `inicio_${dia}`, 5);
    const fim = texto(formData, `fim_${dia}`, 5);
    if (!inicio || !fim || inicio >= fim) continue;

    const pausaInicio = texto(formData, `pausaInicio_${dia}`, 5) || null;
    const pausaFim = texto(formData, `pausaFim_${dia}`, 5) || null;
    const pausaValida = pausaInicio && pausaFim && pausaInicio < pausaFim;

    linhas.push({
      profissionalId,
      diaSemana: dia,
      inicio,
      fim,
      pausaInicio: pausaValida ? pausaInicio : null,
      pausaFim: pausaValida ? pausaFim : null,
    });
  }

  await prisma.$transaction([
    prisma.horarioTrabalho.deleteMany({ where: { profissionalId } }),
    prisma.horarioTrabalho.createMany({ data: linhas }),
  ]);
  atualizarTudo();
}

export async function salvarServicosDoProfissionalAction(formData: FormData) {
  await exigirDono();
  const profissionalId = texto(formData, "profissional", 50);
  if (!profissionalId) throw new Error("Profissional não informado.");

  const escolhidos = formData
    .getAll("servicos")
    .map((v) => String(v))
    .filter(Boolean);

  await prisma.$transaction([
    prisma.servicoProfissional.deleteMany({ where: { profissionalId } }),
    prisma.servicoProfissional.createMany({
      data: escolhidos.map((servicoId) => ({ servicoId, profissionalId })),
    }),
  ]);
  atualizarTudo();
}

// ===== Folgas e feriados =====

export async function criarBloqueioAction(formData: FormData) {
  const u = await exigirUsuario();
  const escolhido = texto(formData, "profissional", 50);
  // Barbeiro comum só bloqueia a própria agenda.
  const profissionalId = ehDono(u.papel) ? escolhido || null : u.profissionalId;

  const inicio = parseInputLocal(texto(formData, "inicio", 30));
  const fim = parseInputLocal(texto(formData, "fim", 30));
  const motivo = texto(formData, "motivo", 120) || null;

  if (!inicio || !fim || fim <= inicio) {
    redirect("/admin/bloqueios?erro=" + encodeURIComponent("Confira as datas: o fim tem que ser depois do início."));
  }

  await prisma.bloqueio.create({ data: { profissionalId, inicio, fim, motivo } });
  atualizarTudo();
}

export async function excluirBloqueioAction(formData: FormData) {
  const u = await exigirUsuario();
  const id = texto(formData, "id", 50);
  const b = await prisma.bloqueio.findUnique({ where: { id } });
  if (!b) return;
  if (!ehDono(u.papel) && b.profissionalId !== u.profissionalId) {
    throw new Error("Você só pode remover bloqueios da sua agenda.");
  }
  await prisma.bloqueio.delete({ where: { id } });
  atualizarTudo();
}

// ===== Configuração da barbearia =====

export async function salvarConfigAction(formData: FormData) {
  await exigirDono();
  const dados = {
    nome: texto(formData, "nome", 80) || "Barbearia",
    slogan: texto(formData, "slogan", 120) || null,
    telefone: soDigitos(texto(formData, "telefone", 30)) || null,
    whatsapp: soDigitos(texto(formData, "whatsapp", 30)) || null,
    endereco: texto(formData, "endereco", 200) || null,
    instagram: texto(formData, "instagram", 60).replace("@", "") || null,
    mapsUrl: texto(formData, "mapsUrl", 300) || null,
    passoMin: Math.max(5, Math.min(60, numero(formData, "passoMin", 15))),
    antecedenciaMin: Math.max(0, Math.min(1440, numero(formData, "antecedenciaMin", 60))),
    diasMax: Math.max(1, Math.min(90, numero(formData, "diasMax", 21))),
    limiteCancelamentoH: Math.max(0, Math.min(72, numero(formData, "limiteCancelamentoH", 2))),
  };

  await prisma.barbearia.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, ...dados },
    update: dados,
  });
  atualizarTudo();
}

// ===== Conta =====

export async function trocarSenhaAction(formData: FormData) {
  const u = await exigirUsuario();
  const atual = String(formData.get("atual") || "");
  const nova = String(formData.get("nova") || "");
  const confirma = String(formData.get("confirma") || "");

  const registro = await prisma.usuario.findUnique({ where: { id: u.id } });
  if (!registro || !conferirSenha(atual, registro.senhaHash)) {
    redirect("/admin/conta?erro=" + encodeURIComponent("Senha atual incorreta."));
  }
  if (nova.length < 6) {
    redirect("/admin/conta?erro=" + encodeURIComponent("A nova senha precisa de pelo menos 6 caracteres."));
  }
  if (nova !== confirma) {
    redirect("/admin/conta?erro=" + encodeURIComponent("A confirmação não bate com a nova senha."));
  }

  await prisma.usuario.update({
    where: { id: u.id },
    data: { senhaHash: hashSenha(nova) },
  });
  redirect("/admin/conta?ok=1");
}
