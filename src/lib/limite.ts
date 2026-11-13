import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// Limite de envios por visitante (anti-abuso) para as ações públicas: votos,
// sugestões, confirmações e inscrições.
//
// Quem é o "visitante": o IP, embaralhado com o segredo do site (o IP em si
// nunca é gravado). Atenção: quem está na mesma rede (ex: o Wi-Fi da empresa)
// sai com o mesmo IP, por isso os limites são folgados: servem para barrar
// robô e clique em massa, não para identificar uma pessoa.
//
// Se a tabela RateLimit ainda não existe (SQL não rodado) ou o banco falhar,
// o limite simplesmente não é aplicado: nunca derruba uma ação legítima.

async function visitante(): Promise<string> {
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "desconhecido";
  return createHash("sha256")
    .update(`${ip}|${process.env.AUTH_SECRET || ""}`)
    .digest("hex")
    .slice(0, 24);
}

// true = pode seguir; false = passou do limite nesta janela de tempo.
export async function dentroDoLimite(acao: string, max: number, janelaSegundos: number): Promise<boolean> {
  try {
    const key = `${acao}:${await visitante()}`;
    const r = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${janelaSegundos}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < now()
                         THEN now() + make_interval(secs => ${janelaSegundos})
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    // Faxina ocasional dos contadores vencidos (1 a cada ~50 chamadas).
    if (Math.random() < 0.02) {
      await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 day'`;
    }
    return (r[0]?.count ?? 1) <= max;
  } catch {
    return true;
  }
}
