import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirDonoPagina } from "@/lib/auth";
import { dataHoraBrasil, hojeISO } from "@/lib/datas";
import { fmtPreco } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatórios" };

// "2026-08" -> primeiro instante do mês e do mês seguinte (Brasília).
function faixaDoMes(mes: string): { inicio: Date; fim: Date } {
  const [ano, m] = mes.split("-").map(Number);
  const proximo = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, "0")}`;
  return {
    inicio: dataHoraBrasil(`${mes}-01`, "00:00"),
    fim: dataHoraBrasil(`${proximo}-01`, "00:00"),
  };
}

function mesVizinho(mes: string, passo: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const total = ano * 12 + (m - 1) + passo;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function nomeDoMes(mes: string): string {
  const texto = dataHoraBrasil(`${mes}-01`, "12:00").toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await exigirDonoPagina();
  const { mes: mesParam } = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(mesParam || "") ? mesParam! : hojeISO().slice(0, 7);
  const { inicio, fim } = faixaDoMes(mes);

  const agendamentos = await prisma.agendamento.findMany({
    where: { inicio: { gte: inicio, lt: fim } },
    include: { servico: true, profissional: true },
  });

  const concluidos = agendamentos.filter((a) => a.status === "concluido");
  const cancelados = agendamentos.filter((a) => a.status === "cancelado").length;
  const faltas = agendamentos.filter((a) => a.status === "faltou").length;
  const faturamento = concluidos.reduce((s, a) => s + a.precoCentavos, 0);
  const ticket = concluidos.length ? Math.round(faturamento / concluidos.length) : 0;
  const peloSite = agendamentos.filter((a) => a.origem === "site").length;

  const cartoes = [
    { rotulo: "Faturamento", valor: fmtPreco(faturamento) },
    { rotulo: "Atendimentos", valor: String(concluidos.length) },
    { rotulo: "Ticket médio", valor: fmtPreco(ticket) },
    { rotulo: "Faltas", valor: String(faltas) },
    { rotulo: "Cancelados", valor: String(cancelados) },
    {
      rotulo: "Vindos do site",
      valor: agendamentos.length
        ? `${Math.round((peloSite / agendamentos.length) * 100)}%`
        : "—",
    },
  ];

  // Agrupamentos simples, feitos em memória (volume de uma barbearia é pequeno).
  function agrupar<T>(lista: typeof concluidos, chave: (a: (typeof concluidos)[number]) => string) {
    const mapa = new Map<string, { qtd: number; total: number }>();
    for (const a of lista) {
      const k = chave(a);
      const atual = mapa.get(k) ?? { qtd: 0, total: 0 };
      atual.qtd++;
      atual.total += a.precoCentavos;
      mapa.set(k, atual);
    }
    return [...mapa.entries()].sort((x, y) => y[1].total - x[1].total);
  }

  const porProfissional = agrupar(concluidos, (a) => a.profissional.apelido || a.profissional.nome);
  const porServico = agrupar(concluidos, (a) => a.servico.nome);
  const maiorTotal = Math.max(1, ...porServico.map(([, v]) => v.total));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="titulo text-2xl text-barba-creme">{nomeDoMes(mes)}</h1>
          <p className="text-sm text-barba-cinza">Só contam os atendimentos marcados como feitos.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/admin/relatorios?mes=${mesVizinho(mes, -1)}`} className="btn-mini">
            ← Mês anterior
          </Link>
          <Link href={`/admin/relatorios?mes=${mesVizinho(mes, 1)}`} className="btn-mini">
            Próximo →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {cartoes.map((c) => (
          <div key={c.rotulo} className="card py-4">
            <p className="rotulo">{c.rotulo}</p>
            <p className="titulo text-2xl text-barba-creme">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="titulo text-lg text-barba-ouro">Por profissional</h2>
          <ul className="mt-3 text-sm">
            {porProfissional.map(([nome, v]) => (
              <li key={nome} className="linha-tabela flex items-center justify-between py-2.5">
                <span className="text-barba-creme">{nome}</span>
                <span className="text-barba-cinza">
                  {v.qtd} corte(s) ·{" "}
                  <strong className="text-barba-ouro">{fmtPreco(v.total)}</strong>
                </span>
              </li>
            ))}
            {porProfissional.length === 0 && (
              <li className="py-4 text-center text-barba-cinza">Nada por aqui ainda.</li>
            )}
          </ul>
        </div>

        <div className="card">
          <h2 className="titulo text-lg text-barba-ouro">Serviços mais rentáveis</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {porServico.map(([nome, v]) => (
              <li key={nome}>
                <div className="flex justify-between">
                  <span className="text-barba-creme">{nome}</span>
                  <span className="text-barba-cinza">
                    {v.qtd}× · {fmtPreco(v.total)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-barba-grafite">
                  <div
                    className="h-full rounded-full bg-barba-ouro"
                    style={{ width: `${Math.round((v.total / maiorTotal) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
            {porServico.length === 0 && (
              <li className="py-4 text-center text-barba-cinza">Nada por aqui ainda.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
