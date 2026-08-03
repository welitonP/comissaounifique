import { prisma } from "./prisma";

export const CONFIG_ID = "config";

export type Config = {
  id: string;
  nome: string;
  slogan: string | null;
  telefone: string | null;
  whatsapp: string | null;
  endereco: string | null;
  instagram: string | null;
  mapsUrl: string | null;
  passoMin: number;
  antecedenciaMin: number;
  diasMax: number;
  limiteCancelamentoH: number;
};

const PADRAO: Omit<Config, "id"> = {
  nome: "Barbearia",
  slogan: null,
  telefone: null,
  whatsapp: null,
  endereco: null,
  instagram: null,
  mapsUrl: null,
  passoMin: 15,
  antecedenciaMin: 60,
  diasMax: 21,
  limiteCancelamentoH: 2,
};

// Sempre existe uma linha só. Se ainda não existir (banco recém-criado),
// devolve os padrões para o site não quebrar antes do seed.
export async function getConfig(): Promise<Config> {
  const c = await prisma.barbearia.findUnique({ where: { id: CONFIG_ID } });
  if (!c) return { id: CONFIG_ID, ...PADRAO };
  return c;
}
