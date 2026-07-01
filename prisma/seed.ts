import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
