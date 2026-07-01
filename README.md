# Comissão de Esportes Unifique

Site interno para a comissão de esportes: agenda de jogos, classificação, comunicados e enquetes.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + PostgreSQL (ex: [Supabase](https://supabase.com))

## Como rodar localmente

1. Crie um projeto gratuito no [Supabase](https://supabase.com) (ou use outro Postgres).
2. Em *Project Settings > Database > Connection string*, copie a string de conexão
   pooled (porta `6543`) e a direta (porta `5432`).
3. Configure o ambiente:

```bash
npm install
cp .env.example .env   # cole DATABASE_URL, DIRECT_URL e ajuste ADMIN_PASSWORD/AUTH_SECRET
npm run db:push        # cria as tabelas no Postgres a partir do schema
npm run db:seed        # (opcional) popula dados de exemplo
npm run dev
```

Acesse http://localhost:3000. A área administrativa fica em `/admin`
(senha definida em `ADMIN_PASSWORD` no `.env`).

## Estrutura

- Acesso é **restrito a membros**: o site inteiro fica atrás de login (`src/middleware.ts`).
  Cada membro tem usuário e senha próprios (`User`). Papéis: `admin` (gerencia membros)
  e `member`. Todos os membros logados podem ver e editar o conteúdo.
- `src/app` — páginas e área de gestão (`/admin/*`):
  - `/entre-empresas` — campeonato Entre Empresas: modalidades, empresas inscritas e informações.
  - `/calendario` — datas de jogos/eventos.
  - `/materiais` — estoque de materiais esportivos (com busca).
  - `/uniformes` — itens controlados (bolsas/uniformes) e quem está com cada um (com busca).
  - `/agenda`, `/classificacao`, `/comunicados`, `/enquetes` — jogos, tabela, avisos e enquetes.
  - `/admin/membros` — gestão de membros (somente admin).
- `public/logo-comissao.jpg` — logo oficial da comissão, exibido no topo e no login.
- É uma **PWA**: pode ser adicionada à tela inicial do celular (`public/manifest.webmanifest`).
- `src/lib/actions.ts` — Server Actions usadas pelos formulários (todo o CRUD).
- `src/lib/auth.ts` — autenticação simples de admin (senha única + cookie assinado).
- `prisma/schema.prisma` — modelo de dados (times, campeonatos, jogos, comunicados, enquetes).

## Deploy na Vercel

1. Suba o repositório no GitHub e importe na [Vercel](https://vercel.com).
2. Em *Environment Variables*, configure `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`
   e `AUTH_SECRET` com os mesmos valores do seu `.env` (use o Postgres do Supabase —
   SQLite não funciona em ambiente serverless, pois o disco é temporário).
3. Faça o deploy. No primeiro deploy, rode `npx prisma db push` uma vez (localmente,
   apontando para o `DATABASE_URL` de produção) para criar as tabelas.
