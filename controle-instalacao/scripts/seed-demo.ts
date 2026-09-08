import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();
const SECTORS = ["Noroeste", "Pavilhão Norte", "Palco Central", "Setor Central", "Sudoeste", "Exposição Direita", "Bosque"];

async function main() {
  await prisma.event.deleteMany({ where: { slug: "expo-demo-2027" } });

  const event = await prisma.event.create({
    data: {
      slug: "expo-demo-2027",
      name: "Expo Demo 2027",
      city: "Videira, SC",
      address: "Rua Dez de Setembro",
      planImage: readFileSync("/tmp/planta-teste.png"),
      planMimeType: "image/png",
    },
  });

  const equipments = [];
  for (let i = 1; i <= 6; i += 1) {
    equipments.push(
      await prisma.equipment.create({
        data: {
          eventId: event.id,
          number: i,
          name: ["Portão principal", "Palco", "Praça de alimentação", "Casa de pedra", "Ginásio", "CCO"][i - 1],
          sector: SECTORS[i % SECTORS.length],
          kind: i % 2 ? "Switch 24P + RB + ZTE" : "RB 750 + ZTE",
          status: i <= 2 ? "ONLINE" : i <= 4 ? "INSTALLED" : "PLANNED",
          x: 12 + i * 13,
          y: i % 2 ? 28 : 72,
          positionChecked: i <= 4,
          notes: `Porta ${i * 3} da RB para as câmeras`,
        },
      }),
    );
  }

  const points = [];
  for (let i = 1; i <= 24; i += 1) {
    points.push(
      await prisma.mapPoint.create({
        data: {
          eventId: event.id,
          number: i,
          name: `Ponto ${String(i).padStart(2, "0")}`,
          sector: SECTORS[i % SECTORS.length],
          status: i <= 8 ? "ACTIVE" : i <= 18 ? "CABLED" : "PENDING",
          x: 6 + ((i * 7) % 88),
          y: 12 + ((i * 23) % 76),
          positionChecked: i % 3 !== 0,
          owner: i % 4 === 0 ? "Equipe A" : null,
          notes: i % 5 === 0 ? "Conferir altura do mastro" : null,
        },
      }),
    );
  }

  for (let i = 1; i <= 10; i += 1) {
    const from = equipments[i % equipments.length];
    const to = points[(i * 2) % points.length];
    await prisma.cable.create({
      data: {
        eventId: event.id,
        number: i,
        label: `Cabo ${i}`,
        kind: "CAT6 externo",
        status: i <= 4 ? "TESTED" : i <= 7 ? "LAID" : "PLANNED",
        fromEquipmentId: from.id,
        toPointId: to.id,
        waypoints: [{ x: (from.x + to.x) / 2, y: from.y }],
        lengthMeters: 40 + i * 5,
        owner: "Equipe B",
      },
    });
  }

  console.log(`Evento demo criado: /eventos/${event.slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
