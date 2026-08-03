import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { consultarAction } from "@/lib/acoes-cliente";
import { diaISO, fmtDiaLongo, fmtHora } from "@/lib/datas";
import { fmtPreco, soDigitos, telefoneValido } from "@/lib/formato";
import { IconeCalendario, IconeSeta } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus horários" };

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  agendado: { texto: "Confirmado", classe: "bg-green-500/15 text-green-400" },
  concluido: { texto: "Atendido", classe: "bg-barba-ouro/15 text-barba-ouro" },
  cancelado: { texto: "Cancelado", classe: "bg-red-500/15 text-red-400" },
  faltou: { texto: "Não compareceu", classe: "bg-orange-500/15 text-orange-400" },
};

export default async function PaginaMeusAgendamentos({
  searchParams,
}: {
  searchParams: Promise<{ tel?: string; erro?: string }>;
}) {
  const { tel, erro } = await searchParams;
  const telefone = soDigitos(tel || "");
  const consultou = telefoneValido(telefone);

  const cliente = consultou
    ? await prisma.cliente.findUnique({
        where: { telefone },
        include: {
          agendamentos: {
            orderBy: { inicio: "desc" },
            take: 20,
            include: { servico: true, profissional: true },
          },
        },
      })
    : null;

  const agora = Date.now();
  const proximos = cliente?.agendamentos.filter(
    (a) => a.status === "agendado" && a.inicio.getTime() >= agora,
  );
  const anteriores = cliente?.agendamentos.filter(
    (a) => !(a.status === "agendado" && a.inicio.getTime() >= agora),
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="titulo text-3xl text-barba-creme">Meus horários</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Digite o WhatsApp que você usou para agendar.
      </p>

      <form action={consultarAction} className="card mt-6 flex gap-2">
        <input
          name="telefone"
          type="tel"
          inputMode="numeric"
          className="campo"
          placeholder="(47) 99999-8888"
          defaultValue={tel || ""}
          required
        />
        <button type="submit" className="btn-ouro shrink-0">
          Buscar
        </button>
      </form>

      {erro && (
        <p className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          Confira o número: precisa ter DDD + número.
        </p>
      )}

      {consultou && !cliente && (
        <div className="card mt-6 text-center">
          <p className="text-sm text-barba-cinza">
            Não achamos nenhum agendamento com esse número.
          </p>
          <Link href="/agendar" className="btn-ouro mt-4">
            Agendar agora
          </Link>
        </div>
      )}

      {cliente && (
        <div className="mt-8 space-y-8">
          {proximos && proximos.length > 0 && (
            <section>
              <h2 className="titulo text-lg text-barba-ouro">Próximos</h2>
              <div className="mt-3 space-y-3">
                {proximos.map((a) => (
                  <Link
                    key={a.id}
                    href={`/agendamento/${a.token}`}
                    className="card surge flex items-center gap-4 transition hover:border-barba-ouro"
                  >
                    <IconeCalendario className="h-5 w-5 shrink-0 text-barba-ouro" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-barba-creme">{a.servico.nome}</p>
                      <p className="text-sm text-barba-cinza">
                        {fmtDiaLongo(diaISO(a.inicio))} às {fmtHora(a.inicio)} ·{" "}
                        {a.profissional.apelido || a.profissional.nome}
                      </p>
                    </div>
                    <IconeSeta className="h-4 w-4 shrink-0 text-barba-cinza" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {anteriores && anteriores.length > 0 && (
            <section>
              <h2 className="titulo text-lg text-barba-cinza">Histórico</h2>
              <div className="mt-3 space-y-2">
                {anteriores.map((a) => {
                  const s = ROTULO_STATUS[a.status] ?? ROTULO_STATUS.agendado;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-barba-borda/60 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-barba-creme">{a.servico.nome}</p>
                        <p className="text-xs text-barba-cinza">
                          {fmtDiaLongo(diaISO(a.inicio))} às {fmtHora(a.inicio)}
                        </p>
                      </div>
                      <span className="text-xs text-barba-cinza">{fmtPreco(a.precoCentavos)}</span>
                      <span className={`selo ${s.classe}`}>{s.texto}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
