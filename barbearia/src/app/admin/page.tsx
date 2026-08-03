import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirUsuarioPagina, ehDono } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { mudarStatusAction } from "@/lib/acoes-admin";
import {
  dataHoraBrasil,
  fmtDiaLongo,
  fmtHora,
  hojeISO,
  somarDias,
} from "@/lib/datas";
import { fmtPreco, fmtTelefone, linkWhatsApp } from "@/lib/formato";
import { IconeCheck, IconeUsuario, IconeWhatsApp, IconeX } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda" };

const ESTILO: Record<string, string> = {
  agendado: "border-barba-borda bg-barba-carvao",
  concluido: "border-green-900/50 bg-green-950/20",
  cancelado: "border-red-900/40 bg-red-950/10 opacity-60",
  faltou: "border-orange-900/40 bg-orange-950/15 opacity-80",
};

const SELO: Record<string, { texto: string; classe: string }> = {
  agendado: { texto: "Marcado", classe: "bg-barba-ouro/15 text-barba-ouro" },
  concluido: { texto: "Atendido", classe: "bg-green-500/15 text-green-400" },
  cancelado: { texto: "Cancelado", classe: "bg-red-500/15 text-red-400" },
  faltou: { texto: "Faltou", classe: "bg-orange-500/15 text-orange-400" },
};

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const { dia: diaParam } = await searchParams;
  const usuario = await exigirUsuarioPagina();
  const dono = ehDono(usuario.papel);

  const dia = /^\d{4}-\d{2}-\d{2}$/.test(diaParam || "") ? diaParam! : hojeISO();
  const inicioDia = dataHoraBrasil(dia, "00:00");
  const fimDia = dataHoraBrasil(somarDias(dia, 1), "00:00");

  const config = await getConfig();

  const profissionais = await prisma.profissional.findMany({
    where: dono ? { ativo: true } : { id: usuario.profissionalId ?? "sem-profissional" },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  const [agendamentos, bloqueios] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        inicio: { gte: inicioDia, lt: fimDia },
        profissionalId: { in: profissionais.map((p) => p.id) },
      },
      include: { cliente: true, servico: true },
      orderBy: { inicio: "asc" },
    }),
    prisma.bloqueio.findMany({
      where: { inicio: { lt: fimDia }, fim: { gt: inicioDia } },
      orderBy: { inicio: "asc" },
    }),
  ]);

  const ativos = agendamentos.filter((a) => a.status === "agendado" || a.status === "concluido");
  const previsto = ativos.reduce((soma, a) => soma + a.precoCentavos, 0);
  const atendidos = agendamentos.filter((a) => a.status === "concluido").length;

  const resumo = [
    { rotulo: "Atendimentos", valor: String(ativos.length) },
    { rotulo: "Já atendidos", valor: String(atendidos) },
    { rotulo: "Previsto no caixa", valor: fmtPreco(previsto) },
  ];

  return (
    <div>
      {/* Navegação de data */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="titulo text-2xl text-barba-creme">{fmtDiaLongo(dia)}</h1>
          <p className="text-sm text-barba-cinza">
            {dia === hojeISO() ? "Agenda de hoje" : "Agenda do dia"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href={`/admin?dia=${somarDias(dia, -1)}`} className="btn-mini">
            ← Anterior
          </Link>
          <Link href="/admin" className="btn-mini">
            Hoje
          </Link>
          <Link href={`/admin?dia=${somarDias(dia, 1)}`} className="btn-mini">
            Próximo →
          </Link>
          <Link href="/admin/novo" className="btn-ouro px-4 py-2">
            + Encaixar
          </Link>
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {resumo.map((r) => (
          <div key={r.rotulo} className="card py-4">
            <p className="rotulo">{r.rotulo}</p>
            <p className="titulo text-2xl text-barba-creme">{r.valor}</p>
          </div>
        ))}
      </div>

      {/* Bloqueios do dia */}
      {bloqueios.length > 0 && (
        <div className="mt-4 space-y-2">
          {bloqueios.map((b) => {
            const prof = profissionais.find((p) => p.id === b.profissionalId);
            if (b.profissionalId && !prof) return null;
            return (
              <p
                key={b.id}
                className="rounded-xl border border-orange-900/40 bg-orange-950/20 px-4 py-2.5 text-sm text-orange-300"
              >
                <strong>{prof ? prof.apelido || prof.nome : "Barbearia fechada"}</strong> ·{" "}
                {fmtHora(b.inicio)} às {fmtHora(b.fim)}
                {b.motivo ? ` — ${b.motivo}` : ""}
              </p>
            );
          })}
        </div>
      )}

      {/* Colunas por profissional */}
      <div
        className="mt-6 grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(17rem, 1fr))` }}
      >
        {profissionais.map((p) => {
          const daPessoa = agendamentos.filter((a) => a.profissionalId === p.id);
          return (
            <section key={p.id}>
              <div className="flex items-center gap-2 border-b border-barba-borda pb-2">
                <IconeUsuario className="h-4 w-4 text-barba-ouro" />
                <h2 className="titulo text-barba-creme">{p.apelido || p.nome}</h2>
                <span className="ml-auto text-xs text-barba-cinza">
                  {daPessoa.filter((a) => a.status !== "cancelado").length} na agenda
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {daPessoa.length === 0 && (
                  <p className="rounded-xl border border-dashed border-barba-borda px-4 py-6 text-center text-sm text-barba-cinza">
                    Nenhum atendimento
                  </p>
                )}

                {daPessoa.map((a) => {
                  const selo = SELO[a.status] ?? SELO.agendado;
                  return (
                    <article
                      key={a.id}
                      className={`surge rounded-xl border p-3 ${ESTILO[a.status] ?? ESTILO.agendado}`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="titulo text-lg text-barba-ouro">{fmtHora(a.inicio)}</span>
                        <span className="text-xs text-barba-cinza">até {fmtHora(a.fim)}</span>
                        <span className={`selo ml-auto ${selo.classe}`}>{selo.texto}</span>
                      </div>

                      <p className="mt-1.5 font-semibold text-barba-creme">{a.cliente.nome}</p>
                      <p className="text-sm text-barba-cinza">
                        {a.servico.nome} · {fmtPreco(a.precoCentavos)}
                      </p>
                      {a.observacao && (
                        <p className="mt-1 text-xs italic text-barba-cinza">“{a.observacao}”</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <a
                          href={linkWhatsApp(
                            a.cliente.telefone,
                            `Olá ${a.cliente.nome.split(" ")[0]}! Aqui é da ${config.nome}, confirmando seu horário de ${fmtHora(a.inicio)}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-mini"
                          title={fmtTelefone(a.cliente.telefone)}
                        >
                          <IconeWhatsApp className="h-3.5 w-3.5 text-green-400" /> Chamar
                        </a>

                        {a.status === "agendado" && (
                          <>
                            <form action={mudarStatusAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="concluido" />
                              <button className="btn-mini text-green-400" type="submit">
                                <IconeCheck className="h-3.5 w-3.5" /> Atendido
                              </button>
                            </form>
                            <form action={mudarStatusAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="faltou" />
                              <button className="btn-mini text-orange-400" type="submit">
                                Faltou
                              </button>
                            </form>
                            <form action={mudarStatusAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="status" value="cancelado" />
                              <button className="btn-mini text-red-400" type="submit">
                                <IconeX className="h-3.5 w-3.5" /> Cancelar
                              </button>
                            </form>
                          </>
                        )}

                        {a.status !== "agendado" && (
                          <form action={mudarStatusAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value="agendado" />
                            <button className="btn-mini" type="submit">
                              Desfazer
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
