import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  // Conta master (dona do site: única que gerencia membros)
  await prisma.user.create({
    data: {
      name: "Weliton Porto",
      username: "weliton.porto",
      role: "master",
      passwordHash: hashPassword("unifique2015"),
    },
  });

  // Itens controlados (uniformes)
  await prisma.trackedItem.createMany({
    data: [
      { name: "Bolsa uniforme masculino futsal", category: "Uniforme Futsal" },
      { name: "Bolsa uniforme feminino vôlei", category: "Uniforme Vôlei" },
      {
        name: "Kit arbitragem",
        category: "Geral",
        holderName: "Weliton Porto",
        since: new Date(),
      },
    ],
  });

  const championship = await prisma.championship.create({
    data: { name: "Campeonato Interno Unifique", season: "2026" },
  });

  const [futsalA, futsalB, voleiA, voleiB] = await Promise.all([
    prisma.team.create({ data: { name: "TI United", modality: "Futsal" } }),
    prisma.team.create({ data: { name: "Comercial FC", modality: "Futsal" } }),
    prisma.team.create({ data: { name: "Atendimento Smash", modality: "Vôlei" } }),
    prisma.team.create({ data: { name: "Financeiro Bloqueio", modality: "Vôlei" } }),
  ]);

  await prisma.match.createMany({
    data: [
      {
        championshipId: championship.id,
        homeTeamId: futsalA.id,
        awayTeamId: futsalB.id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: "Quadra Unifique",
        status: "scheduled",
      },
      {
        championshipId: championship.id,
        homeTeamId: voleiA.id,
        awayTeamId: voleiB.id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: "Ginásio Unifique",
        status: "finished",
        homeScore: 3,
        awayScore: 1,
      },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: "Bem-vindo à Comissão de Esportes Unifique!",
      body: "Fique de olho na agenda de jogos e nos comunicados por aqui.",
    },
  });

  await prisma.poll.create({
    data: {
      question: "Qual nova modalidade a comissão deve organizar em 2026?",
      options: {
        create: [{ text: "Tênis de mesa" }, { text: "Corrida" }, { text: "Basquete 3x3" }],
      },
    },
  });

  // Modalidades do Entre Empresas + inscritos
  const futsal = await prisma.modality.create({
    data: {
      name: "Futsal",
      description: "Campeonato de futsal masculino entre empresas.",
      info: "Jogos aos sábados no Ginásio Municipal. Equipes de até 12 atletas.",
      order: 1,
      registrations: {
        create: [
          { companyName: "Unifique", responsible: "Weliton", contact: "(47) 99999-0000" },
          { companyName: "Empresa Parceira A", responsible: "João" },
        ],
      },
    },
  });

  const volei = await prisma.modality.create({
    data: {
      name: "Vôlei",
      description: "Vôlei misto entre empresas.",
      info: "Jogos às quartas-feiras. Equipes mistas (mín. 2 mulheres em quadra).",
      order: 2,
      registrations: {
        create: [{ companyName: "Unifique", responsible: "Maria" }],
      },
    },
  });

  // Calendário de datas visível a todos
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: "Rodada de Futsal",
        date: new Date("2026-07-17T19:00:00"),
        modalityId: futsal.id,
        location: "Ginásio Municipal",
        description: "Primeira rodada do Entre Empresas.",
      },
      {
        title: "Rodada de Vôlei",
        date: new Date("2026-07-22T19:30:00"),
        modalityId: volei.id,
        location: "Ginásio Municipal",
      },
    ],
  });

  // Estoque de materiais
  await prisma.material.createMany({
    data: [
      { name: "Bola de Futsal", category: "Futsal", quantity: 5 },
      { name: "Bola de Vôlei", category: "Vôlei", quantity: 5 },
      { name: "Rede de Vôlei", category: "Vôlei", quantity: 1 },
      { name: "Coletes", category: "Geral", quantity: 20, notes: "10 azuis, 10 amarelos" },
    ],
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
