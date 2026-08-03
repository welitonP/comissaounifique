import { prisma } from "@/lib/prisma";
import { exigirDonoPagina } from "@/lib/auth";
import { fmtData } from "@/lib/datas";
import { fmtPreco, fmtTelefone, linkWhatsApp, soDigitos } from "@/lib/formato";
import { IconeWhatsApp } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await exigirDonoPagina();
  const { q } = await searchParams;
  const busca = (q || "").trim();
  const digitos = soDigitos(busca);

  const clientes = await prisma.cliente.findMany({
    where: busca
      ? {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            ...(digitos ? [{ telefone: { contains: digitos } }] : []),
          ],
        }
      : undefined,
    orderBy: { criadoEm: "desc" },
    take: 100,
    include: {
      agendamentos: {
        select: { status: true, precoCentavos: true, inicio: true },
      },
    },
  });

  const linhas = clientes
    .map((c) => {
      const concluidos = c.agendamentos.filter((a) => a.status === "concluido");
      const faltas = c.agendamentos.filter((a) => a.status === "faltou").length;
      const gasto = concluidos.reduce((s, a) => s + a.precoCentavos, 0);
      const ultima = concluidos.length
        ? concluidos.map((a) => a.inicio).sort((a, b) => b.getTime() - a.getTime())[0]
        : null;
      return { c, visitas: concluidos.length, faltas, gasto, ultima };
    })
    .sort((a, b) => b.visitas - a.visitas);

  return (
    <div>
      <h1 className="titulo text-2xl text-barba-creme">Clientes</h1>
      <p className="mt-1 text-sm text-barba-cinza">
        Cadastro criado sozinho a cada agendamento, pelo número de WhatsApp.
      </p>

      <form className="card mt-6 flex gap-2">
        <input
          name="q"
          className="campo"
          placeholder="Buscar por nome ou telefone"
          defaultValue={busca}
        />
        <button type="submit" className="btn-ouro shrink-0">
          Buscar
        </button>
      </form>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-barba-borda text-left text-xs uppercase tracking-wider text-barba-cinza">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3 text-center">Cortes</th>
              <th className="px-4 py-3 text-center">Faltas</th>
              <th className="px-4 py-3 text-right">Total gasto</th>
              <th className="px-4 py-3">Última vez</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ c, visitas, faltas, gasto, ultima }) => (
              <tr key={c.id} className="linha-tabela">
                <td className="px-4 py-3 font-semibold text-barba-creme">{c.nome}</td>
                <td className="px-4 py-3">
                  <a
                    href={linkWhatsApp(c.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-barba-cinza hover:text-barba-ouro"
                  >
                    <IconeWhatsApp className="h-3.5 w-3.5 text-green-400" />
                    {fmtTelefone(c.telefone)}
                  </a>
                </td>
                <td className="px-4 py-3 text-center text-barba-creme">{visitas}</td>
                <td className={`px-4 py-3 text-center ${faltas > 0 ? "text-orange-400" : "text-barba-cinza"}`}>
                  {faltas}
                </td>
                <td className="px-4 py-3 text-right text-barba-ouro">{fmtPreco(gasto)}</td>
                <td className="px-4 py-3 text-barba-cinza">
                  {ultima ? fmtData(ultima) : "—"}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-barba-cinza">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
