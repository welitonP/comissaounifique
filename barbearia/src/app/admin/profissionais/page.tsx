import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirDonoPagina } from "@/lib/auth";
import { alternarProfissionalAction, salvarProfissionalAction } from "@/lib/acoes-admin";
import { DIAS_SEMANA_CURTO } from "@/lib/datas";
import { iniciais } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipe" };

export default async function PaginaProfissionais() {
  await exigirDonoPagina();

  const profissionais = await prisma.profissional.findMany({
    orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { nome: "asc" }],
    include: {
      horarios: { orderBy: { diaSemana: "asc" } },
      _count: { select: { servicos: true } },
    },
  });

  return (
    <div>
      <h1 className="titulo text-2xl text-barba-creme">Equipe</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Quem atende, em que dias e quais serviços cada um faz.
      </p>

      <form action={salvarProfissionalAction} className="card mt-6 grid gap-3 sm:grid-cols-2">
        <p className="titulo text-barba-ouro sm:col-span-2">Novo profissional</p>
        <div>
          <label className="rotulo">Nome completo</label>
          <input name="nome" className="campo" required />
        </div>
        <div>
          <label className="rotulo">Como aparece no site</label>
          <input name="apelido" className="campo" placeholder="Zé" />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo">Descrição curta</label>
          <input name="bio" className="campo" placeholder="Especialista em degradê e navalha" />
        </div>
        <button type="submit" className="btn-ouro sm:col-span-2">
          Adicionar
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {profissionais.map((p) => {
          const diasQueTrabalha = p.horarios.map((h) => h.diaSemana);
          return (
            <div key={p.id} className={`card ${p.ativo ? "" : "opacity-50"}`}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-barba-ouro/40 bg-barba-grafite">
                  <span className="titulo text-barba-ouro">{iniciais(p.nome)}</span>
                </div>

                <form action={salvarProfissionalAction} className="grid flex-1 gap-3 sm:grid-cols-3">
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <label className="rotulo">Nome</label>
                    <input name="nome" className="campo" defaultValue={p.nome} required />
                  </div>
                  <div>
                    <label className="rotulo">Apelido</label>
                    <input name="apelido" className="campo" defaultValue={p.apelido ?? ""} />
                  </div>
                  <div>
                    <label className="rotulo">Ordem</label>
                    <input name="ordem" type="number" className="campo" defaultValue={p.ordem} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="rotulo">Descrição</label>
                    <input name="bio" className="campo" defaultValue={p.bio ?? ""} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
                    <button type="submit" className="btn-mini">
                      Salvar
                    </button>
                    <button
                      type="submit"
                      formAction={alternarProfissionalAction}
                      className={`btn-mini ${p.ativo ? "text-red-400" : "text-green-400"}`}
                    >
                      {p.ativo ? "Afastar da agenda" : "Reativar"}
                    </button>
                    <Link href={`/admin/profissionais/${p.id}`} className="btn-mini">
                      Horários e serviços
                    </Link>
                  </div>
                </form>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-barba-borda/60 pt-3 text-xs">
                <span className="text-barba-cinza">Atende:</span>
                {DIAS_SEMANA_CURTO.map((d, i) => (
                  <span
                    key={d}
                    className={`rounded px-1.5 py-0.5 ${
                      diasQueTrabalha.includes(i)
                        ? "bg-barba-ouro/20 text-barba-ouro"
                        : "bg-barba-grafite text-barba-cinza/40"
                    }`}
                  >
                    {d}
                  </span>
                ))}
                <span className="ml-auto text-barba-cinza">
                  {p._count.servicos} serviço(s) liberado(s)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
