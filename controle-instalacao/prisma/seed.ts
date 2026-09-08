import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (p: string, s: string, k: number) => Promise<Buffer>;
const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}

async function main() {
  const username = process.env.SEED_ADMIN_USER ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      "Defina SEED_ADMIN_PASSWORD (8+ caracteres) antes de rodar o seed.\n" +
        "Ex.: SEED_ADMIN_PASSWORD='umaSenhaBoa' npm run db:seed",
    );
  }

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: await hash(password), role: "admin", active: true },
    create: {
      username,
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      passwordHash: await hash(password),
      role: "admin",
    },
  });

  console.log(`Administrador pronto: ${user.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
