# Controle de instalação

Controle de campo para instalação de rede em eventos: posiciona **APs**,
**equipamentos principais** e **cabos** sobre a planta do local e acompanha o
que já está pendente, cabeado, ativo ou testado.

Diferente de um site feito para um evento só, aqui **cada evento é um registro**:
a lista inicial mostra todos, e um evento novo pode ser criado do zero ou
**clonado** de um anterior, já vindo com pontos, equipamentos e cabos montados.

## Stack

- [Next.js](https://nextjs.org/) 15 (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Prisma](https://www.prisma.io/) + PostgreSQL (ex.: [Supabase](https://supabase.com))
- [lucide-react](https://lucide.dev/) para os ícones

## Como rodar localmente

1. Crie um Postgres (Supabase, Neon ou local).
2. Configure o ambiente:

```bash
npm install
cp .env.example .env    # preencha DATABASE_URL, DIRECT_URL e AUTH_SECRET
npm run db:push         # cria as tabelas a partir do schema
SEED_ADMIN_PASSWORD='umaSenhaBoa' npm run db:seed   # cria o primeiro admin
npm run dev
```

Acesse http://localhost:3000 e entre com o usuário `admin`.

> `AUTH_SECRET` precisa de 32+ caracteres aleatórios: `openssl rand -base64 48`.

## Como funciona

### Acesso

O site inteiro fica atrás de login (`src/middleware.ts`). Cada pessoa tem
usuário e senha próprios — é o nome dela que aparece no histórico. Há dois
papéis: `admin` (gerencia membros) e `member` (edita o conteúdo).

### Eventos

- `/` — lista de eventos com o progresso de cada um.
- **Novo evento** — nome, cidade, datas, planta e, opcionalmente, o evento a clonar.
  Ao clonar, tudo entra como *pendente* e com a *posição a conferir*, porque a
  planta nova quase nunca tem o mesmo enquadramento da anterior.
- `/eventos/<slug>` — o painel de controle daquele evento.

### O painel de controle

- **Estatísticas** — pontos ativos, cabo passado, pendentes, equipamentos e cabos.
- **Mapa** — zoom pela roda do mouse, pelos botões ou com dois dedos; arraste para
  mover. As camadas de APs, equipamentos e cabos ligam e desligam
  independentemente, e "Ver original" compara a planta tratada com a original.
- **Painel lateral** — edita o item selecionado. "Mover no mapa" põe o mapa em
  modo de posicionamento: o próximo toque define a posição, que também pode ser
  digitada em porcentagem.
- **Tabelas** — relação de pontos, equipamentos e cabos. Clicar numa linha abre
  o item no painel.
- **Barra de utilidades** — desfazer, importar CSV, exportar CSV, backup JSON,
  imprimir e histórico.

### Posições em porcentagem

Marcadores são guardados como `x`/`y` **de 0 a 100**, não em pixels. Assim o
mapa funciona em qualquer resolução de tela, em qualquer nível de zoom, e a
planta pode ser trocada por uma versão maior sem perder o posicionamento.

### Histórico e desfazer

Toda alteração grava uma linha em `ChangeLog` com o estado anterior. O botão
**Desfazer** reverte a última alteração ainda não desfeita — inclusive uma
exclusão, que é recriada a partir do snapshot.

### Importação e exportação

- **Exportar** gera CSV com separador `;` e BOM, que o Excel em português abre
  direto com os acentos certos.
- **Importar** aceita `;` ou `,`. A coluna `numero` é a chave: linha com número
  já existente **atualiza**, número novo **cria**. O jeito mais seguro de montar
  o arquivo é exportar primeiro e usar como modelo.
- **Backup** baixa um JSON com todos os dados do evento (sem a imagem da planta).

## Deploy na Vercel

1. Suba o repositório no GitHub e importe na [Vercel](https://vercel.com).
2. Em *Environment Variables*, configure `DATABASE_URL`, `DIRECT_URL` e
   `AUTH_SECRET`. Use Postgres gerenciado — SQLite não funciona em serverless,
   porque o disco é temporário.
3. No primeiro deploy, rode `npx prisma db push` uma vez apontando para o
   `DATABASE_URL` de produção, e depois o seed para criar o administrador.

## Estrutura

```
prisma/schema.prisma       modelo de dados (Event, MapPoint, Equipment, Cable, ChangeLog, User)
src/middleware.ts          bloqueia o site inteiro para quem não está logado
src/lib/auth.ts            senhas com scrypt e sessão em cookie assinado
src/lib/actions.ts         server actions: todo o CRUD, importação, desfazer
src/lib/events.ts          carregamento e resumo estatístico de um evento
src/lib/csv.ts             leitura e escrita de CSV
src/components/MapView.tsx planta com zoom, pan e marcadores
src/components/EditorPanel.tsx  formulários de AP, equipamento e cabo
src/app/api/planta/[id]    serve a imagem da planta (só para quem está logado)
src/app/api/export/...     CSV de pontos, equipamentos e cabos
src/app/api/backup/[slug]  backup JSON do evento
scripts/seed-demo.ts       evento de demonstração com dados fictícios
```
