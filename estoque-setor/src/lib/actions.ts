"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { dataDoInput, normalizarNome } from "./estoque";

/** Limite generoso, só pra não deixar entrar texto absurdo no banco. */
function texto(valor: FormDataEntryValue | null, max = 200): string {
  return String(valor ?? "")
    .trim()
    .slice(0, max);
}

function opcional(valor: FormDataEntryValue | null, max = 200): string | null {
  const t = texto(valor, max);
  return t === "" ? null : t;
}

/** Acha o produto pelo nome normalizado ou cria na hora — sem catálogo prévio. */
async function acharOuCriarProduto(nome: string, categoria: string | null) {
  const nomeChave = normalizarNome(nome);
  const existente = await prisma.produto.findUnique({ where: { nomeChave } });
  if (existente) {
    // Categoria só é preenchida se ainda estiver vazia; não sobrescreve o que já existe.
    if (categoria && !existente.categoria) {
      return prisma.produto.update({
        where: { id: existente.id },
        data: { categoria },
      });
    }
    return existente;
  }
  return prisma.produto.create({ data: { nome, nomeChave, categoria } });
}

export async function registrarEntrada(formData: FormData) {
  const nome = texto(formData.get("nome"), 120);
  if (!nome) redirect("/?erro=nome");

  const categoria = opcional(formData.get("categoria"), 60);
  const serial = opcional(formData.get("serial"), 80);
  const observacao = opcional(formData.get("observacao"), 300);
  const registradoPor = opcional(formData.get("quem"), 60);
  const entradaEm = dataDoInput(texto(formData.get("entrada"), 10));

  const pedido = Number(formData.get("quantidade") ?? 1);
  const quantidade = Number.isFinite(pedido)
    ? Math.min(200, Math.max(1, Math.trunc(pedido)))
    : 1;

  const produto = await acharOuCriarProduto(nome, categoria);

  await prisma.unidade.createMany({
    data: Array.from({ length: quantidade }, () => ({
      produtoId: produto.id,
      // Serial só faz sentido quando se registra uma peça de cada vez.
      serial: quantidade === 1 ? serial : null,
      observacao,
      entradaEm,
      registradoPor,
    })),
  });

  revalidatePath("/");
  redirect(`/?ok=entrada&n=${quantidade}`);
}

export async function registrarSaida(formData: FormData) {
  const id = texto(formData.get("id"), 40);
  if (!id) redirect("/?erro=id");

  // `saidaEm: null` no filtro evita dar baixa duas vezes na mesma peça se dois
  // colegas clicarem ao mesmo tempo.
  await prisma.unidade.updateMany({
    where: { id, saidaEm: null },
    data: {
      saidaEm: new Date(),
      destino: opcional(formData.get("destino"), 200),
      retiradoPor: opcional(formData.get("quem"), 60),
    },
  });

  revalidatePath("/");
  revalidatePath("/historico");
  redirect("/?ok=saida");
}

export async function excluirUnidade(formData: FormData) {
  const id = texto(formData.get("id"), 40);
  if (id) await prisma.unidade.delete({ where: { id } }).catch(() => null);

  revalidatePath("/");
  revalidatePath("/historico");
  redirect("/?ok=excluido");
}

/** Desfaz uma saída: a peça volta pro estoque com a entrada original. */
export async function desfazerSaida(formData: FormData) {
  const id = texto(formData.get("id"), 40);
  if (id) {
    await prisma.unidade.updateMany({
      where: { id, saidaEm: { not: null } },
      data: { saidaEm: null, destino: null, retiradoPor: null },
    });
  }

  revalidatePath("/");
  revalidatePath("/historico");
  redirect("/historico?ok=desfeito");
}

type BackupUnidade = {
  modelo?: unknown;
  serial?: unknown;
  entrada?: unknown;
  obs?: unknown;
  saida?: unknown;
  destino?: unknown;
};

/** Importa o JSON gerado pela primeira versão (o HTML que rodava no navegador). */
export async function importarBackup(formData: FormData) {
  const conteudo = String(formData.get("json") ?? "");

  let dados: { itens?: BackupUnidade[]; saidas?: BackupUnidade[] };
  try {
    dados = JSON.parse(conteudo);
  } catch {
    redirect("/importar?erro=json");
  }

  const itens = Array.isArray(dados.itens) ? dados.itens : [];
  const saidas = Array.isArray(dados.saidas) ? dados.saidas : [];
  if (itens.length === 0 && saidas.length === 0) redirect("/importar?erro=vazio");

  let importados = 0;
  for (const registro of [...itens, ...saidas]) {
    const nome = String(registro.modelo ?? "").trim().slice(0, 120);
    if (!nome) continue;

    const produto = await acharOuCriarProduto(nome, null);
    const saida = typeof registro.saida === "string" ? registro.saida : null;

    await prisma.unidade.create({
      data: {
        produtoId: produto.id,
        serial: String(registro.serial ?? "").trim().slice(0, 80) || null,
        observacao: String(registro.obs ?? "").trim().slice(0, 300) || null,
        entradaEm: dataDoInput(String(registro.entrada ?? "")),
        saidaEm: saida ? dataDoInput(saida) : null,
        destino: String(registro.destino ?? "").trim().slice(0, 200) || null,
      },
    });
    importados++;
  }

  revalidatePath("/");
  revalidatePath("/historico");
  redirect(`/?ok=importado&n=${importados}`);
}
