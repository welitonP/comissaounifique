import { prisma } from "./prisma";

// As colunas do arquivo do regulamento (rulesData/rulesMime/rulesName) entram
// no banco por um SQL rodado à mão no Supabase. Enquanto ele não roda, as
// páginas não podem pedir essas colunas (o Prisma quebraria a página).
// Guardamos só o "sim": depois que as colunas existem, não consulta de novo.
let colunasOk = false;

export async function temColunasArquivoRegulamento(): Promise<boolean> {
  if (colunasOk) return true;
  try {
    const r = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_name = 'Tournament' AND column_name IN ('rulesData', 'rulesMime', 'rulesName')`;
    colunasOk = (r[0]?.n ?? 0) === 3;
  } catch {
    colunasOk = false;
  }
  return colunasOk;
}

// Mesma ideia para as colunas de e-mail das inscrições
// (scripts/email-e-limites.sql). Enquanto não existem, os formulários não
// pedem e-mail e nada é gravado nelas.
let emailOk = false;

export async function temColunasEmail(): Promise<boolean> {
  if (emailOk) return true;
  try {
    const r = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM information_schema.columns
      WHERE column_name = 'email' AND table_schema = current_schema()
        AND table_name IN ('TournamentSignup', 'TrainingSignup', 'Enrollment')`;
    emailOk = (r[0]?.n ?? 0) === 3;
  } catch {
    emailOk = false;
  }
  return emailOk;
}
