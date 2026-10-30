import Link from "next/link";
import Image from "next/image";
import { CalendarClock, ChevronRight, MapPin, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { esporte, FORMATOS, type Formato } from "@/lib/campeonato/esportes";
import { tabelaNaoExiste } from "@/lib/campeonato/dados";
import { fmtDataHora } from "@/lib/datas";
import TiltCard from "@/components/anim/TiltCard";
import { StatusCampeonato } from "@/components/campeonato/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campeonatos" };

async function carregar() {
  try {
    return await prisma.cup.findMany({
      where: { status: { not: "rascunho" } },
      orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { teams: true } },
        matches: { where: { status: { in: ["ao_vivo", "encerrado"] } }, select: { status: true } },
      },
    });
  } catch (e) {
    if (tabelaNaoExiste(e)) return null;
    throw e;
  }
}

export default async function CampeonatosPage() {
  const cups = await carregar();

  return (
    <div className="space-y-8">
      <section className="banner-vivo relative overflow-hidden rounded-3xl bg-gradient-to-br from-unifique-dark via-unifique to-unifique-blue px-6 py-10 text-white shadow-lg sm:px-10">
        <div aria-hidden className="anim-aurora pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-unifique-teal/30 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="anim-flutuar relative flex-none">
            <span aria-hidden className="anel-logo absolute -inset-1.5 rounded-full" />
            <Image
              src="/logo-comissao.png"
              alt="Comissão de Esportes Unifique"
              width={112}
              height={112}
              className="relative h-28 w-28 rounded-full bg-white object-cover"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-unifique-teal">Comissão de Esportes</p>
            <h1 className="titulo-reflexo mt-1 font-display text-3xl font-extrabold sm:text-4xl">Campeonatos</h1>
            <p className="mt-2 max-w-xl text-white/85">
              Tabela, chaveamento, placar ao vivo e artilharia de todos os campeonatos da Unifique.
            </p>
          </div>
        </div>
      </section>

      {cups === null && (
        <p className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
          Os campeonatos ainda estão sendo ativados no banco de dados. Volte daqui a pouco!
        </p>
      )}

      {cups && cups.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800">
          <Trophy size={36} className="mx-auto text-gray-300" />
          <p className="mt-2 font-display font-semibold text-gray-700 dark:text-slate-200">Nenhum campeonato rolando</p>
          <p className="text-sm text-gray-500">Quando a comissão abrir um campeonato, ele aparece aqui.</p>
        </div>
      )}

      {cups && cups.length > 0 && (
        <div className="em-sequencia grid gap-4 sm:grid-cols-2">
          {cups.map((c) => {
            const esp = esporte(c.sport);
            const aoVivo = c.matches.some((m) => m.status === "ao_vivo");
            const feitos = c.matches.filter((m) => m.status === "encerrado").length;
            return (
              <TiltCard key={c.id} className="rounded-3xl" max={4}>
                <Link
                  href={`/campeonatos/${c.slug ?? c.id}`}
                  className="group block overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-xl dark:bg-slate-800"
                >
                  <div className={`relative overflow-hidden bg-gradient-to-br ${esp.gradiente} px-5 pb-5 pt-4 text-white`}>
                    <span
                      aria-hidden
                      className="absolute -right-4 -top-6 select-none text-[110px] leading-none opacity-25 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
                    >
                      {esp.emoji}
                    </span>
                    <div className="relative flex items-center justify-between gap-2">
                      <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                        {esp.nome}
                      </span>
                      <StatusCampeonato status={c.status} aoVivo={aoVivo} />
                    </div>
                    <h2 className="relative mt-6 font-display text-2xl font-extrabold leading-tight drop-shadow">{c.name}</h2>
                    <p className="relative text-sm font-medium text-white/85">{FORMATOS[c.format as Formato]?.nome}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={15} className="text-unifique-blue" /> {c._count.teams} equipes
                    </span>
                    {c.startDate && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={15} className="text-unifique-blue" /> {fmtDataHora(c.startDate)}
                      </span>
                    )}
                    {c.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} className="text-unifique-blue" /> {c.location}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold text-unifique dark:text-unifique-teal">
                      {feitos} {feitos === 1 ? "jogo" : "jogos"}
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
