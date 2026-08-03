import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/config";
import { fmtDiaLongo, diaISO, fmtHora } from "@/lib/datas";
import { fmtPreco, fmtTelefone, linkWhatsApp, primeiroNome } from "@/lib/formato";
import { cancelarPeloClienteAction } from "@/lib/acoes-cliente";
import {
  IconeCalendario,
  IconeCheck,
  IconeLocal,
  IconeRelogio,
  IconeUsuario,
  IconeWhatsApp,
  IconeX,
} from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu agendamento" };

const ESTILO_STATUS: Record<string, { texto: string; classe: string }> = {
  agendado: { texto: "Confirmado", classe: "bg-green-500/15 text-green-400" },
  concluido: { texto: "Atendido", classe: "bg-barba-ouro/15 text-barba-ouro" },
  cancelado: { texto: "Cancelado", classe: "bg-red-500/15 text-red-400" },
  faltou: { texto: "Não compareceu", classe: "bg-orange-500/15 text-orange-400" },
};

export default async function PaginaComprovante({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ novo?: string; cancelado?: string; erro?: string }>;
}) {
  const { token } = await params;
  const busca = await searchParams;

  const [agendamento, config] = await Promise.all([
    prisma.agendamento.findUnique({
      where: { token },
      include: { cliente: true, profissional: true, servico: true },
    }),
    getConfig(),
  ]);

  if (!agendamento) notFound();

  const status = ESTILO_STATUS[agendamento.status] ?? ESTILO_STATUS.agendado;
  const prazoCancelamento = agendamento.inicio.getTime() - config.limiteCancelamentoH * 3600000;
  const podeCancelar = agendamento.status === "agendado" && Date.now() < prazoCancelamento;

  const mensagemWhats = `Olá! Sou ${agendamento.cliente.nome}, tenho horário marcado dia ${fmtDiaLongo(
    diaISO(agendamento.inicio),
  )} às ${fmtHora(agendamento.inicio)}.`;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      {busca.novo && (
        <div className="surge mb-6 rounded-2xl border border-green-900/60 bg-green-950/30 p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500/20 text-green-400">
            <IconeCheck className="h-6 w-6" />
          </div>
          <h1 className="titulo mt-3 text-2xl text-barba-creme">
            Pronto, {primeiroNome(agendamento.cliente.nome)}!
          </h1>
          <p className="mt-1 text-sm text-barba-cinza">
            Seu horário está garantido. Salve esta página ou tire um print.
          </p>
        </div>
      )}

      {busca.cancelado && (
        <p className="mb-6 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          Agendamento cancelado. Se quiser, é só marcar outro horário.
        </p>
      )}
      {busca.erro === "prazo" && (
        <p className="mb-6 rounded-xl border border-orange-900/60 bg-orange-950/40 px-4 py-3 text-sm text-orange-300">
          O prazo para cancelar pelo site já passou. Fale direto com a barbearia no WhatsApp.
        </p>
      )}

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <span className={`selo ${status.classe}`}>{status.texto}</span>
          <span className="text-xs text-barba-cinza">
            Código {agendamento.token.slice(-6).toUpperCase()}
          </span>
        </div>

        <h2 className="titulo mt-4 text-2xl text-barba-creme">{agendamento.servico.nome}</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <IconeCalendario className="h-4 w-4 shrink-0 text-barba-ouro" />
            <dd className="font-semibold text-barba-creme">
              {fmtDiaLongo(diaISO(agendamento.inicio))}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <IconeRelogio className="h-4 w-4 shrink-0 text-barba-ouro" />
            <dd className="font-semibold text-barba-creme">
              {fmtHora(agendamento.inicio)} às {fmtHora(agendamento.fim)}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <IconeUsuario className="h-4 w-4 shrink-0 text-barba-ouro" />
            <dd className="text-barba-creme">
              com {agendamento.profissional.apelido || agendamento.profissional.nome}
            </dd>
          </div>
          {config.endereco && (
            <div className="flex items-start gap-3">
              <IconeLocal className="mt-0.5 h-4 w-4 shrink-0 text-barba-ouro" />
              <dd className="text-barba-cinza">{config.endereco}</dd>
            </div>
          )}
          {agendamento.observacao && (
            <div className="rounded-xl bg-barba-grafite px-3 py-2 text-barba-cinza">
              “{agendamento.observacao}”
            </div>
          )}
          <div className="flex justify-between border-t border-barba-borda/60 pt-3">
            <dt className="text-barba-cinza">Valor</dt>
            <dd className="titulo text-xl text-barba-ouro">
              {fmtPreco(agendamento.precoCentavos)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {agendamento.status === "agendado" && (
          <a href={`/api/agenda/${agendamento.token}.ics`} className="btn-contorno">
            <IconeCalendario className="h-4 w-4" /> Salvar no celular
          </a>
        )}
        {config.whatsapp && (
          <a
            href={linkWhatsApp(config.whatsapp, mensagemWhats)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-contorno"
          >
            <IconeWhatsApp className="h-4 w-4 text-green-400" /> Falar com a barbearia
          </a>
        )}
      </div>

      {podeCancelar && (
        <form action={cancelarPeloClienteAction} className="mt-4">
          <input type="hidden" name="token" value={agendamento.token} />
          <button type="submit" className="btn-perigo w-full">
            <IconeX className="h-4 w-4" /> Cancelar este horário
          </button>
          <p className="mt-2 text-center text-xs text-barba-cinza">
            Dá para cancelar aqui até {config.limiteCancelamentoH}h antes. Depois disso, é só chamar
            no WhatsApp {config.whatsapp ? fmtTelefone(config.whatsapp) : ""}.
          </p>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/agendar" className="btn-mini">
          Marcar outro horário
        </Link>
      </div>
    </div>
  );
}
