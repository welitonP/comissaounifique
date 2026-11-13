import { PrismaClient } from "@prisma/client";

// As colunas "email" das inscrições entram no banco por um SQL rodado à mão
// (scripts/email-e-limites.sql). Para o site não quebrar antes disso, elas
// ficam FORA de todas as consultas por padrão. Quem precisa do e-mail pede
// de forma explícita (omit: { email: false }) e só depois de conferir que a
// coluna existe (temColunasEmail, em schema-check.ts).
const criar = () =>
  new PrismaClient({
    omit: {
      tournamentSignup: { email: true },
      trainingSignup: { email: true },
      enrollment: { email: true },
    },
  });

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof criar> };

export const prisma = globalForPrisma.prisma ?? criar();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
