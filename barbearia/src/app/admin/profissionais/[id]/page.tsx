import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirDonoPagina } from "@/lib/auth";
import {
  salvarExpedienteAction,
  salvarServicosDoProfissionalAction,
} from "@/lib/acoes-admin";
import { DIAS_SEMANA } from "@/lib/datas";
import { fmtPreco } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaExpediente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirDonoPagina();
  const { id } = await params;

  const [profissional, servicos] = await Promise.all([
    prisma.profissional.findUnique({
      where: { id },
      include: { horarios: true, servicos: true },
    }),
    prisma.servico.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
  ]);

  if (!profissional) notFound();

  const porDia = new Map(profissional.horarios.map((h) => [h.diaSemana, h]));
  const liberados = new Set(profissional.servicos.map((s) => s.servicoId));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/profissionais" className="text-sm text-barba-cinza hover:text-barba-ouro">
        ← Equipe
      </Link>
      <h1 className="titulo mt-2 text-2xl text-barba-creme">
        {profissional.apelido || profissional.nome}
      </h1>

      {/* Expediente */}
      <form action={salvarExpedienteAction} className="card mt-6">
        <input type="hidden" name="profissional" value={profissional.id} />
        <h2 className="titulo text-barba-ouro">Expediente da semana</h2>
        <p className="mt-1 text-sm text-barba-cinza">
          Desmarque o dia para folga fixa. A pausa é o almoço — deixe em branco se não tiver.
        </p>

        <div className="mt-4 space-y-2">
          {DIAS_SEMANA.map((nome, dia) => {
            const h = porDia.get(dia);
            return (
              <div
                key={dia}
                className="grid items-center gap-2 rounded-xl border border-barba-borda/60 p-3 sm:grid-cols-[10rem_1fr_1fr_1fr_1fr]"
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-barba-creme">
                  <input
                    type="checkbox"
                    name={`ativo_${dia}`}
                    defaultChecked={!!h}
                    className="accent-barba-ouro"
                  />
                  {nome}
                </label>

                <label className="text-xs text-barba-cinza">
                  Abre
                  <input
                    type="time"
                    name={`inicio_${dia}`}
                    className="campo mt-0.5 px-2 py-1.5"
                    defaultValue={h?.inicio ?? "09:00"}
                  />
                </label>
                <label className="text-xs text-barba-cinza">
                  Fecha
                  <input
                    type="time"
                    name={`fim_${dia}`}
                    className="campo mt-0.5 px-2 py-1.5"
                    defaultValue={h?.fim ?? "19:00"}
                  />
                </label>
                <label className="text-xs text-barba-cinza">
                  Pausa de
                  <input
                    type="time"
                    name={`pausaInicio_${dia}`}
                    className="campo mt-0.5 px-2 py-1.5"
                    defaultValue={h?.pausaInicio ?? ""}
                  />
                </label>
                <label className="text-xs text-barba-cinza">
                  Pausa até
                  <input
                    type="time"
                    name={`pausaFim_${dia}`}
                    className="campo mt-0.5 px-2 py-1.5"
                    defaultValue={h?.pausaFim ?? ""}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <button type="submit" className="btn-ouro mt-4 w-full">
          Salvar expediente
        </button>
      </form>

      {/* Serviços */}
      <form action={salvarServicosDoProfissionalAction} className="card mt-6">
        <input type="hidden" name="profissional" value={profissional.id} />
        <h2 className="titulo text-barba-ouro">Serviços que ele faz</h2>
        <p className="mt-1 text-sm text-barba-cinza">
          O cliente só vê este profissional nos serviços marcados aqui.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {servicos.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-barba-borda/60 px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                name="servicos"
                value={s.id}
                defaultChecked={liberados.has(s.id)}
                className="accent-barba-ouro"
              />
              <span className="text-barba-creme">{s.nome}</span>
              <span className="ml-auto text-xs text-barba-cinza">
                {s.duracaoMin}min · {fmtPreco(s.precoCentavos)}
              </span>
            </label>
          ))}
        </div>

        <button type="submit" className="btn-ouro mt-4 w-full">
          Salvar serviços
        </button>
      </form>
    </div>
  );
}
