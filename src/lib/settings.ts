import { prisma } from "./prisma";

const INSCRICOES = "inscricoes_abertas";
const TEAMS_LINK = "teams_link";

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

export async function getTeamsLink(): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key: TEAMS_LINK } });
  return s?.value || null;
}

export async function setTeamsLink(link: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key: TEAMS_LINK },
    create: { key: TEAMS_LINK, value: link },
    update: { value: link },
  });
}
