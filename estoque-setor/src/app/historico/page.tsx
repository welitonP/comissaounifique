import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { desfazerSaida } from "@/lib/actions";
import { diasDesde, formatarData, labelTempo, normalizarNome } from "@/lib/estoque";
import BotaoConfirmar from "@/components/BotaoConfirmar";
import Aviso from "@/components/Aviso";

export const dynamic = "force-dynamic";

const POR_PAGINA = 50;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const ok = typeof params.ok === "string" ? params.ok : undefined;
  const paginaPedida = Number(typeof params.p === "string" ? params.p : 1);
  const pagina = Number.isFinite(paginaPedida) ? Math.max(1, Math.trunc(paginaPedida)) : 1;

  const filtro = {
    saidaEm: { not: null },
    ...(q
      ? {
          OR: [
            // `nomeChave` é o nome sem acento e em minúsculo — busca tolerante.
            { produto: { nomeChave: { contains: normalizarNome(q) } } },
            { serial: { contains: q, mode: "insensitive" as const } },
            { destino: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [saidas, total] = await Promise.all([
    prisma.unidade.findMany({
      where: filtro,
      include: { produto: { select: { nome: true } } },
      orderBy: { saidaEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.unidade.count({ where: filtro }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-5">
      <Aviso ok={ok} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold text-unifique">Histórico de saídas</h1>
        <span className="text-sm text-gray-500">{total} registradas</span>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por modelo, serial ou destino..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Buscar
        </button>
      </form>

      {saidas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
          {q ? `Nada encontrado para "${q}".` : "Nenhuma saída registrada ainda."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {saidas.map((saida) => {
            // `saidaEm` nunca é nulo aqui: o filtro só traz peças que já saíram.
            const diasParado = diasDesde(saida.entradaEm, saida.saidaEm!);
            return (
              <li key={saida.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                <div className="min-w-[200px] flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {saida.produto.nome}
                    {saida.serial && (
                      <span className="ml-2 font-mono text-xs text-gray-500">
                        {saida.serial}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    entrou {formatarData(saida.entradaEm)} · saiu{" "}
                    {formatarData(saida.saidaEm!)}
                    {saida.destino && ` → ${saida.destino}`}
                    {saida.retiradoPor && ` · por ${saida.retiradoPor}`}
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  ficou {labelTempo(diasParado)}
                </span>

                <form action={desfazerSaida}>
                  <input type="hidden" name="id" value={saida.id} />
                  <BotaoConfirmar
                    pergunta={`Desfazer a saída de "${saida.produto.nome}"? A peça volta pro estoque.`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Desfazer
                  </BotaoConfirmar>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link
              href={`/historico?p=${pagina - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-gray-500">
            página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link
              href={`/historico?p=${pagina + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
