-- E-mail corporativo nas inscrições + tabela de limites de envio.
-- Pode rodar no SQL Editor do Supabase ou no psql do servidor.
-- É seguro rodar mais de uma vez e não apaga nem altera dado nenhum.

BEGIN;

ALTER TABLE "TournamentSignup" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "TrainingSignup"   ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Enrollment"       ADD COLUMN IF NOT EXISTS "email" TEXT;

CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- A tabela nova fica com o mesmo dono e a mesma proteção (RLS) das tabelas
-- que o site já usa.
DO $$
DECLARE dono text; rls boolean;
BEGIN
  SELECT tableowner, rowsecurity INTO dono, rls FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Tournament';
  IF dono IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "RateLimit" OWNER TO %I', dono);
  END IF;
  IF rls THEN
    ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

COMMIT;
