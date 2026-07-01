# Comissão de Esportes Unifique

Site interno para a comissão de esportes: agenda de jogos, classificação, comunicados e enquetes.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + SQLite (fácil de trocar para Postgres depois)

## Como rodar localmente

```bash
npm install
cp .env.example .env   # ajuste ADMIN_PASSWORD e AUTH_SECRET
npm run db:push        # cria o banco SQLite a partir do schema
npm run db:seed        # (opcional) popula dados de exemplo
npm run dev
```

Acesse http://localhost:3000. A área administrativa fica em `/admin`
(senha definida em `ADMIN_PASSWORD` no `.env`).

## Estrutura

- `src/app` — páginas públicas (`/`, `/agenda`, `/classificacao`, `/comunicados`, `/enquetes`)
  e área administrativa (`/admin/*`) para cadastrar times, jogos, comunicados e enquetes.
- `src/lib/actions.ts` — Server Actions usadas pelos formulários (todo o CRUD).
- `src/lib/auth.ts` — autenticação simples de admin (senha única + cookie assinado).
- `prisma/schema.prisma` — modelo de dados (times, campeonatos, jogos, comunicados, enquetes).

## Deploy

Funciona em qualquer host com suporte a Node.js (Vercel, Railway, etc). Para produção,
recomenda-se trocar o SQLite por Postgres: basta alterar `provider` e `DATABASE_URL`
no `prisma/schema.prisma`/`.env` e rodar `npx prisma db push` novamente.
