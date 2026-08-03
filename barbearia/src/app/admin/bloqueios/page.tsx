import { prisma } from "@/lib/prisma";
import { exigirUsuarioPagina, ehDono } from "@/lib/auth";
import { criarBloqueioAction, excluirBloqueioAction } from "@/lib/acoes-admin";
import { fmtDataHora, paraInputLocal } from "@/lib/datas";
import { IconeX } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Folgas e feriados" };

export default async function PaginaBloqueios({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const usuario = await exigirUsuarioPagina();
  const dono = ehDono(usuario.papel);

  const [profissionais, bloqueios] = await Promise.all([
    prisma.profissional.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    prisma.bloqueio.findMany({
      where: {
        fim: { gte: new Date() },
        ...(dono ? {} : { OR: [{ profissionalId: usuario.profissionalId }, { profissionalId: null }] }),
      },
      orderBy: { inicio: "asc" },
      include: { profissional: true },
      take: 60,
    }),
  ]);

  const agora = new Date();
  const daquiUmaHora = new Date(agora.getTime() + 3600000);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="titulo text-2xl text-barba-creme">Folgas e feriados</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Bloqueie um período e ele some da agenda do site na hora.
      </p>

      {erro && (
        <p className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <form action={criarBloqueioAction} className="card mt-6 grid gap-3 sm:grid-cols-2">
        {dono && (
          <div className="sm:col-span-2">
            <label className="rotulo">Quem fica indisponível</label>
            <select name="profissional" className="campo" defaultValue="">
              <option value="">A barbearia toda (feriado, reforma...)</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  Só {p.apelido || p.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="rotulo">Começa</label>
          <input
            type="datetime-local"
            name="inicio"
            className="campo"
            defaultValue={paraInputLocal(agora)}
            required
          />
        </div>
        <div>
          <label className="rotulo">Termina</label>
          <input
            type="datetime-local"
            name="fim"
            className="campo"
            defaultValue={paraInputLocal(daquiUmaHora)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo">Motivo (opcional)</label>
          <input name="motivo" className="campo" placeholder="Médico, feriado, curso..." maxLength={120} />
        </div>

        <button type="submit" className="btn-ouro sm:col-span-2">
          Bloquear período
        </button>
      </form>

      <h2 className="titulo mt-8 text-lg text-barba-ouro">Próximos bloqueios</h2>
      <div className="mt-3 space-y-2">
        {bloqueios.length === 0 && (
          <p className="rounded-xl border border-dashed border-barba-borda px-4 py-6 text-center text-sm text-barba-cinza">
            Nenhum bloqueio cadastrado.
          </p>
        )}

        {bloqueios.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-xl border border-barba-borda bg-barba-carvao px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-barba-creme">
                {b.profissional ? b.profissional.apelido || b.profissional.nome : "Barbearia fechada"}
              </p>
              <p className="text-barba-cinza">
                {fmtDataHora(b.inicio)} → {fmtDataHora(b.fim)}
                {b.motivo ? ` · ${b.motivo}` : ""}
              </p>
            </div>
            <form action={excluirBloqueioAction}>
              <input type="hidden" name="id" value={b.id} />
              <button type="submit" className="btn-mini text-red-400">
                <IconeX className="h-3.5 w-3.5" /> Remover
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
