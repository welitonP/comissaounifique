-- Campeonatos: cria as tabelas novas (Cup, CupTeam, CupMatch, CupEvent).
-- Pode rodar no SQL Editor do Supabase ou no psql do servidor.
-- É seguro rodar mais de uma vez e não mexe em nenhuma tabela existente.

BEGIN;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Cup" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "description" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "groupsCount" INTEGER NOT NULL DEFAULT 2,
    "qualifiers" INTEGER NOT NULL DEFAULT 2,
    "doubleRound" BOOLEAN NOT NULL DEFAULT false,
    "thirdPlace" BOOLEAN NOT NULL DEFAULT false,
    "allowDraw" BOOLEAN NOT NULL DEFAULT true,
    "pointsWin" INTEGER NOT NULL DEFAULT 3,
    "pointsDraw" INTEGER NOT NULL DEFAULT 1,
    "pointsLoss" INTEGER NOT NULL DEFAULT 0,
    "setsToWin" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CupTeam" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#212492',
    "group" TEXT,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "players" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CupMatch" (
    "id" TEXT NOT NULL,
    "cupId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "group" TEXT,
    "round" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 0,
    "homeId" TEXT,
    "awayId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homePens" INTEGER,
    "awayPens" INTEGER,
    "partials" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "date" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CupEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT,
    "player" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "minute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Cup_slug_key" ON "Cup"("slug");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupTeam_cupId_fkey') THEN
    ALTER TABLE "CupTeam" ADD CONSTRAINT "CupTeam_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "Cup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupMatch_cupId_fkey') THEN
    ALTER TABLE "CupMatch" ADD CONSTRAINT "CupMatch_cupId_fkey" FOREIGN KEY ("cupId") REFERENCES "Cup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupMatch_homeId_fkey') THEN
    ALTER TABLE "CupMatch" ADD CONSTRAINT "CupMatch_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "CupTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupMatch_awayId_fkey') THEN
    ALTER TABLE "CupMatch" ADD CONSTRAINT "CupMatch_awayId_fkey" FOREIGN KEY ("awayId") REFERENCES "CupTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupEvent_matchId_fkey') THEN
    ALTER TABLE "CupEvent" ADD CONSTRAINT "CupEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CupMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CupEvent_teamId_fkey') THEN
    ALTER TABLE "CupEvent" ADD CONSTRAINT "CupEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "CupTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- As tabelas novas ficam com o mesmo dono das tabelas que o site já usa
-- (assim o site tem permissão, mesmo rodando este arquivo como postgres).
DO $$
DECLARE dono text;
BEGIN
  SELECT tableowner INTO dono FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Tournament';
  IF dono IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "Cup" OWNER TO %I', dono);
    EXECUTE format('ALTER TABLE "CupTeam" OWNER TO %I', dono);
    EXECUTE format('ALTER TABLE "CupMatch" OWNER TO %I', dono);
    EXECUTE format('ALTER TABLE "CupEvent" OWNER TO %I', dono);
  END IF;
END $$;

COMMIT;
