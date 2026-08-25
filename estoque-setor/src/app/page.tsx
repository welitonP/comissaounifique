import { prisma } from "@/lib/prisma";
import { registrarEntrada, excluirUnidade } from "@/lib/actions";
import {
  corTempo,
  diasDesde,
  formatarData,
  hojeInput,
  labelTempo,
  normalizarNome,
} from "@/lib/estoque";
import PessoaField from "@/components/PessoaField";
import SaidaInline from "@/components/SaidaInline";
import BotaoConfirmar from "@/components/BotaoConfirmar";
import Aviso from "@/components/Aviso";

export const dynamic = "force-dynamic";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const ok = typeof params.ok === "string" ? params.ok : undefined;
  const erro = typeof params.erro === "string" ? params.erro : undefined;
  const quantidade = typeof params.n === "string" ? Number(params.n) : undefined;

  const emEstoque = { saidaEm: null } as const;

  const [produtos, totalPecas, totalModelos, maisAntiga, nomesConhecidos] =
    await Promise.all([
      prisma.produto.findMany({
        where: {
          unidades: { some: emEstoque },
          ...(q
            ? {
                OR: [
                  // `nomeChave` já está sem acento e em minúsculo, então buscar
                  // "optico" encontra "Conversor Óptico".
                  { nomeChave: { contains: normalizarNome(q) } },
                  { categoria: { contains: q, mode: "insensitive" as const } },
                  {
                    unidades: {
                      some: {
                        ...emEstoque,
                        serial: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                  {
                    unidades: {
                      some: {
                        ...emEstoque,
                        observacao: { contains: q, mode: "insensitive" as const },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          unidades: { where: emEstoque, orderBy: { entradaEm: "asc" } },
        },
        orderBy: { nome: "asc" },
      }),
      prisma.unidade.count({ where: emEstoque }),
      prisma.produto.count({ where: { unidades: { some: emEstoque } } }),
      prisma.unidade.findFirst({
        where: emEstoque,
        orderBy: { entradaEm: "asc" },
        select: { entradaEm: true },
      }),
      prisma.produto.findMany({
        select: { nome: true },
        orderBy: { nome: "asc" },
        take: 300,
      }),
    ]);

  const diasMaisAntiga = maisAntiga ? diasDesde(maisAntiga.entradaEm) : null;

  return (
    <div className="space-y-6">
      <Aviso ok={ok} erro={erro} quantidade={quantidade} />

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-unifique">{totalPecas}</div>
          <div className="text-xs text-gray-500">peças em estoque</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-unifique">{totalModelos}</div>
          <div className="text-xs text-gray-500">modelos diferentes</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-2xl font-bold text-unifique">
            {diasMaisAntiga === null ? "—" : `${diasMaisAntiga}d`}
          </div>
          <div className="text-xs text-gray-500">peça mais antiga</div>
        </div>
      </section>

      <details className="rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-unifique">
          ➕ Registrar entrada
        </summary>
        <form action={registrarEntrada} className="space-y-3 border-t border-gray-100 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nome" className="mb-1 block text-xs text-gray-500">
                Equipamento / modelo
              </label>
              <input
                id="nome"
                name="nome"
                required
                maxLength={120}
                list="modelos"
                placeholder="Ex: Mikrotik hEX GR3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
              <datalist id="modelos">
                {nomesConhecidos.map((p) => (
                  <option key={p.nome} value={p.nome} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="quantidade" className="mb-1 block text-xs text-gray-500">
                Quantidade
              </label>
              <input
                id="quantidade"
                name="quantidade"
                type="number"
                min={1}
                max={200}
                defaultValue={1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
            </div>

            <div>
              <label htmlFor="entrada" className="mb-1 block text-xs text-gray-500">
                Data de entrada
              </label>
              <input
                id="entrada"
                name="entrada"
                type="date"
                defaultValue={hojeInput()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
            </div>

            <div>
              <label htmlFor="serial" className="mb-1 block text-xs text-gray-500">
                Serial / patrimônio (só quando a quantidade é 1)
              </label>
              <input
                id="serial"
                name="serial"
                maxLength={80}
                placeholder="Ex: SN12345"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
            </div>

            <div>
              <label htmlFor="categoria" className="mb-1 block text-xs text-gray-500">
                Categoria (opcional)
              </label>
              <input
                id="categoria"
                name="categoria"
                maxLength={60}
                placeholder="Ex: Roteador, ONU, Cabo"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="observacao" className="mb-1 block text-xs text-gray-500">
                Observação (opcional)
              </label>
              <input
                id="observacao"
                name="observacao"
                maxLength={300}
                placeholder="Ex: veio pra manutenção, cliente X..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">Quem registrou</label>
              <PessoaField className="w-full" />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-unifique px-4 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
          >
            Adicionar ao estoque
          </button>
        </form>
      </details>

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por modelo, serial, categoria ou observação..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Buscar
        </button>
      </form>

      <section className="space-y-3">
        {produtos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {q
              ? `Nada encontrado para "${q}".`
              : "Estoque vazio. Use “Registrar entrada” pra começar."}
          </p>
        ) : (
          produtos.map((produto) => {
            const diasDoMaisAntigo = diasDesde(produto.unidades[0].entradaEm);
            return (
              <details
                key={produto.id}
                open={produtos.length <= 3 || q !== ""}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className="flex-1 font-semibold text-gray-800">
                    {produto.nome}
                    {produto.categoria && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {produto.categoria}
                      </span>
                    )}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${corTempo(diasDoMaisAntigo)}`}>
                    mais antigo: {labelTempo(diasDoMaisAntigo)}
                  </span>
                  <span className="rounded-full bg-unifique px-3 py-1 text-xs font-bold text-white">
                    {produto.unidades.length}
                  </span>
                </summary>

                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                  {produto.unidades.map((unidade) => {
                    const dias = diasDesde(unidade.entradaEm);
                    return (
                      <li
                        key={unidade.id}
                        className="flex flex-wrap items-center gap-2 px-4 py-3"
                      >
                        <div className="min-w-[180px] flex-1">
                          <div className="text-sm text-gray-800">
                            {unidade.serial ? (
                              <span className="font-mono">{unidade.serial}</span>
                            ) : (
                              <span className="text-gray-400">sem serial</span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            entrou {formatarData(unidade.entradaEm)}
                            {unidade.registradoPor && ` · por ${unidade.registradoPor}`}
                            {unidade.observacao && ` · ${unidade.observacao}`}
                          </div>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${corTempo(dias)}`}>
                          {labelTempo(dias)}
                        </span>

                        <SaidaInline id={unidade.id} />

                        <form action={excluirUnidade}>
                          <input type="hidden" name="id" value={unidade.id} />
                          <BotaoConfirmar
                            pergunta={`Excluir esta peça de "${produto.nome}" sem registrar saída?`}
                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-800"
                          >
                            ✕
                          </BotaoConfirmar>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })
        )}
      </section>
    </div>
  );
}
