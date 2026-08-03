"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { getConfig } from "./config";
import { continuaLivre, carregarAgenda, horariosLivres } from "./agenda";
import { dataHoraBrasil, hojeISO, diffDias } from "./datas";
import { soDigitos, telefoneValido } from "./formato";

// Monta a URL do passo de confirmação com uma mensagem de erro.
function voltarComErro(params: URLSearchParams, erro: string): never {
  params.set("erro", erro);
  redirect(`/agendar?${params.toString()}`);
}

export async function agendarAction(formData: FormData) {
  const servicoId = String(formData.get("servico") || "");
  const profParam = String(formData.get("prof") || "");
  const dia = String(formData.get("dia") || "");
  const hora = String(formData.get("hora") || "");
  const nome = String(formData.get("nome") || "").trim().slice(0, 120);
  const telefoneBruto = String(formData.get("telefone") || "");
  const observacao = String(formData.get("observacao") || "").trim().slice(0, 300) || null;

  const params = new URLSearchParams({ servico: servicoId, prof: profParam, dia, hora });

  if (!servicoId || !profParam || !dia || !hora) {
    voltarComErro(params, "Faltou escolher alguma coisa. Tente de novo.");
  }
  if (nome.length < 2) {
    voltarComErro(params, "Escreva seu nome completo.");
  }
  const telefone = soDigitos(telefoneBruto);
  if (!telefoneValido(telefone)) {
    voltarComErro(params, "Confira o WhatsApp: precisa ter DDD + número.");
  }

  const config = await getConfig();
  const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
  if (!servico || !servico.ativo) {
    voltarComErro(params, "Esse serviço não está mais disponível.");
  }

  // A agenda só fica aberta dentro da janela configurada.
  const distancia = diffDias(hojeISO(), dia);
  if (distancia < 0 || distancia > config.diasMax) {
    voltarComErro(params, "Essa data está fora do período de agendamento.");
  }

  const inicio = dataHoraBrasil(dia, hora);
  if (isNaN(inicio.getTime())) voltarComErro(params, "Horário inválido.");
  const fim = new Date(inicio.getTime() + servico.duracaoMin * 60000);

  if (inicio.getTime() < Date.now() + config.antecedenciaMin * 60000) {
    voltarComErro(params, "Esse horário está muito em cima. Escolha outro.");
  }

  // Descobre quem vai atender: o escolhido, ou o mais livre do dia se o
  // cliente marcou "tanto faz".
  let profissionalId = profParam;
  if (profParam === "qualquer") {
    const candidatos = await prisma.profissional.findMany({
      where: { ativo: true, servicos: { some: { servicoId } } },
      select: { id: true },
    });
    const ctx = await carregarAgenda(
      candidatos.map((c) => c.id),
      dia,
      dia,
      { passoMin: config.passoMin, antecedenciaMin: config.antecedenciaMin },
    );
    const livres = candidatos.filter((c) =>
      horariosLivres(ctx, c.id, dia, servico.duracaoMin).includes(hora),
    );
    if (livres.length === 0) {
      voltarComErro(params, "Esse horário acabou de ser preenchido. Escolha outro.");
    }
    // Entre os livres, fica com quem tem menos serviço marcado naquele dia.
    const contagens = await Promise.all(
      livres.map(async (c) => ({
        id: c.id,
        total: await prisma.agendamento.count({
          where: {
            profissionalId: c.id,
            status: "agendado",
            inicio: { gte: dataHoraBrasil(dia, "00:00") },
            fim: { lte: dataHoraBrasil(dia, "23:59") },
          },
        }),
      })),
    );
    contagens.sort((a, b) => a.total - b.total);
    profissionalId = contagens[0].id;
  } else {
    const prof = await prisma.profissional.findUnique({ where: { id: profissionalId } });
    if (!prof || !prof.ativo) voltarComErro(params, "Esse profissional não está mais atendendo.");
  }

  // Última conferência antes de gravar: protege contra dois clientes fechando
  // o mesmo horário ao mesmo tempo.
  if (!(await continuaLivre(profissionalId, inicio, fim))) {
    voltarComErro(params, "Esse horário acabou de ser preenchido. Escolha outro.");
  }

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    create: { nome, telefone },
    update: { nome },
  });

  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId: cliente.id,
      profissionalId,
      servicoId,
      inicio,
      fim,
      precoCentavos: servico.precoCentavos,
      observacao,
      origem: "site",
      status: "agendado",
    },
  });

  revalidatePath("/admin");
  redirect(`/agendamento/${agendamento.token}?novo=1`);
}

export async function cancelarPeloClienteAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const agendamento = await prisma.agendamento.findUnique({ where: { token } });
  if (!agendamento) redirect("/");

  const config = await getConfig();
  const limite = agendamento.inicio.getTime() - config.limiteCancelamentoH * 3600000;

  if (agendamento.status !== "agendado" || Date.now() > limite) {
    redirect(`/agendamento/${token}?erro=prazo`);
  }

  await prisma.agendamento.update({
    where: { id: agendamento.id },
    data: { status: "cancelado" },
  });

  revalidatePath("/admin");
  redirect(`/agendamento/${token}?cancelado=1`);
}

// Consulta pública por telefone: mostra os agendamentos do cliente.
export async function consultarAction(formData: FormData) {
  const telefone = soDigitos(String(formData.get("telefone") || ""));
  if (!telefoneValido(telefone)) redirect("/meus-agendamentos?erro=1");
  redirect(`/meus-agendamentos?tel=${telefone}`);
}
