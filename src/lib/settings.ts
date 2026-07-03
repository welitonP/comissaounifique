import { prisma } from "./prisma";

const INSCRICOES = "inscricoes_abertas";

export async function isInscricoesAbertas(): Promise<boolean> {
  const s = await prisma.setting.findUnique({ where: { key: INSCRICOES } });
  return s?.value === "1";
}

export async function setInscricoesAbertas(open: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: INSCRICOES },
    create: { key: INSCRICOES, value: open ? "1" : "0" },
    update: { value: open ? "1" : "0" },
  });
}

