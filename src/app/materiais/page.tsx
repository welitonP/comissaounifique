import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/lib/auth";
import AdminTopo from "@/components/admin/AdminTopo";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Estoque é restrito à comissão (além do middleware, reforço na própria página).
  await requireUserPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const materials = await prisma.material.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const totalItens = materials.reduce((sum, m) => sum + m.quantity, 0);

  // Agrupar por categoria
  const groups = new Map<string, typeof materials>();
  for (const m of materials) {
    const key = m.category || "Sem categoria";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <AdminTopo titulo="Materiais" />
          <p className="mt-1 text-gray-600">Estoque de materiais esportivos da comissão.</p>
        </div>
        <span className="rounded-full bg-unifique-light px-4 py-1 text-sm font-medium text-unifique">
          {totalItens} itens {q ? "encontrados" : "no total"}
        </span>
      </div>

      <form method="get" className="flex items-end gap-2">
        <Campo rotulo="Buscar equipamento" className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Ex: bola, colete, rede..."
            className="campo"
          />
        </Campo>
        <button
          type="submit"
          className="btn-primario"
        >
          Buscar
        </button>
        {q && (
          <Link href="/materiais" className="btn-claro">
            Limpar
          </Link>
        )}
      </form>

      {materials.length === 0 && (
        <p className="text-gray-500">
          {q ? "Nenhum material encontrado para a busca." : "Nenhum material cadastrado ainda."}
        </p>
      )}

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([category, items]) => (
          <section key={category} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-unifique">{category}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-3"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    {m.notes && <p className="text-xs text-gray-500">{m.notes}</p>}
                  </div>
                  <span
                    className={`ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      m.quantity === 0 ? "bg-red-400" : "bg-unifique-blue"
                    }`}
                  >
                    {m.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
