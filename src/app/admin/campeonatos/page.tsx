import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trophy } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esporte, FORMATOS, type Formato } from "@/lib/campeonato/esportes";
import { tabelaNaoExiste } from "@/lib/campeonato/dados";
import { StatusCampeonato } from "@/components/campeonato/ui";

export const dynamic = "force-dynamic";

export default async function AdminCampeonatosPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireUserPage();
  const params = await searchParams;
  let cups;
  try {
    cups = await prisma.cup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { teams: true, matches: true } },
        matches: { select: { status: true } },
      },
    });
  } catch (e) {
    if (!tabelaNaoExiste(e)) throw e;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-display text-2xl font-bold text-unifique">Campeonatos</h1>
        <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Falta criar as tabelas de campeonato no banco.</p>
          <p className="mt-1">
            Rode <code className="rounded bg-amber-100 px-1">npm run db:push</code> uma vez apontando para o banco de
            produção e recarregue esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="campeonato space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-unifique-blue hover:underline">
        <ChevronLeft size={16} /> Gerenciar
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-unifique dark:text-unifique-teal">Campeonatos</h1>
          <p className="text-sm text-gray-500">Tabela, chaveamento e placar ao vivo de qualquer esporte.</p>
        </div>
        <Link
          href="/admin/campeonatos/novo"
          className="btn-brilho inline-flex items-center gap-2 rounded-xl bg-unifique px-4 py-2.5 font-display font-semibold text-white shadow transition hover:bg-unifique-dark"
        >
          <Plus size={18} /> Novo campeonato
        </Link>
      </div>

      {params.ok === "excluido" && (
        <p className="aviso-entrar rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">Campeonato excluído.</p>
      )}

      {cups.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800">
          <Trophy size={36} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700 dark:text-slate-200">Nenhum campeonato ainda</p>
          <p className="text-sm text-gray-500">Escolha o esporte, o formato e cole os times. O site monta a tabela.</p>
          <Link
            href="/admin/campeonatos/novo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-unifique px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Criar campeonato
          </Link>
        </div>
      ) : (
        <div className="em-sequencia grid gap-3 md:grid-cols-2">
          {cups.map((c) => {
            const esp = esporte(c.sport);
            const feitos = c.matches.filter((m) => m.status === "encerrado").length;
            const total = c.matches.filter((m) => m.status !== "folga").length;
            const aoVivo = c.matches.some((m) => m.status === "ao_vivo");
            return (
              <Link
                key={c.id}
                href={`/admin/campeonatos/${c.id}`}
                className="group flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md dark:bg-slate-800"
              >
                <span className={`flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-gradient-to-br ${esp.gradiente} text-3xl shadow-inner transition-transform group-hover:-rotate-6 group-hover:scale-105`}>
                  {esp.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusCampeonato status={c.status} aoVivo={aoVivo} claro />
                  </div>
                  <h2 className="mt-1 truncate font-display text-lg font-bold text-unifique dark:text-unifique-teal">{c.name}</h2>
                  <p className="text-xs text-gray-500">
                    {esp.nome} · {FORMATOS[c.format as Formato]?.nome} · {c._count.teams} equipes
                    {total > 0 && ` · ${feitos}/${total} jogos`}
                  </p>
                </div>
                <ChevronRight size={20} className="flex-none text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-unifique" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
