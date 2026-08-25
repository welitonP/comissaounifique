# Estoque do Setor

Controle simples do que o setor tem em estoque: o que chegou, quanto tem de cada
modelo, há quanto tempo cada peça está parada na bancada e pra onde ela foi.

Sem login — quem tem o link acessa. O banco é compartilhado, então as ~6 pessoas
do setor veem sempre o mesmo estoque.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + PostgreSQL (ex: [Supabase](https://supabase.com))

## Como rodar

1. Crie um projeto gratuito no [Supabase](https://supabase.com) (ou use outro Postgres).
2. Em *Project Settings > Database > Connection string*, copie a string **pooled**
   (porta `6543`) e a **direta** (porta `5432`).
3. No terminal, dentro desta pasta:

```bash
npm install
cp .env.example .env    # cole DATABASE_URL e DIRECT_URL
npm run db:push         # cria as tabelas no Postgres
npm run dev
```

Acesse http://localhost:3000.

## Deploy na Vercel

Este app mora numa subpasta do repositório, então na Vercel:

1. Importe o repositório e, em *Settings > General > Root Directory*, aponte para
   `estoque-setor`.
2. Em *Environment Variables*, configure `DATABASE_URL` e `DIRECT_URL` com os
   mesmos valores do `.env`.
3. Faça o deploy. Antes do primeiro acesso, rode `npm run db:push` uma vez
   localmente apontando para o banco de produção, pra criar as tabelas.

Depois é só passar o link pro pessoal do setor.

## Como funciona

- **Produto** é o modelo (ex: "Mikrotik hEX GR3"). Você não cadastra catálogo:
  o produto é criado sozinho na primeira entrada. O nome é normalizado
  (minúsculo, sem acento), então "GR3", "gr3" e "Gr3 " contam como o mesmo item
  e a quantidade não se divide.
- **Unidade** é a peça física. Enquanto não tem saída registrada, ela está no
  estoque. É por isso que dá pra ver a quantidade *e* o tempo de cada peça.
- Na entrada dá pra registrar **várias peças iguais de uma vez** (campo
  Quantidade). Serial só é gravado quando a quantidade é 1, que é quando ele
  identifica uma peça específica.
- Como não há login, cada pessoa digita o nome uma vez e o navegador guarda pra
  preencher sozinho nas próximas.
- As cores do tempo na bancada: verde até 14 dias, amarelo de 15 a 29, vermelho
  a partir de 30.

## Páginas

- `/` — estoque atual, agrupado por modelo, com busca e registro de entrada/saída.
- `/historico` — saídas já registradas, com busca e opção de desfazer.
- `/importar` — traz os dados da primeira versão (veja abaixo).

## Versão antiga

`legado/estoque-offline.html` é a primeira versão, um HTML único que guardava
tudo no próprio navegador. Ficou aqui porque funciona sem internet e sem banco.

Se você chegou a usar ela, clique em **Backup** lá pra baixar o `.json`, abra o
arquivo num editor de texto e cole o conteúdo em `/importar` — os itens e o
histórico de saídas entram no banco compartilhado.

## Tabelas

As tabelas usam o prefixo `estoque_` (`estoque_produto`, `estoque_unidade`), então
este app pode dividir o mesmo Postgres com outro projeto sem conflito de nomes.
Ainda assim, um projeto Supabase separado é mais fácil de manter.
