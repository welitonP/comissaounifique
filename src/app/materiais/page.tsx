import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/lib/auth";

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
          <h1 className="text-2xl font-bold text-unifique">Materiais</h1>
          <p className="mt-1 text-gray-600">Estoque de materiais esportivos da comissão.</p>
        </div>
        <span className="rounded-full bg-unifique-light px-4 py-1 text-sm font-medium text-unifique">
          {totalItens} itens {q ? "encontrados" : "no total"}
        </span>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar equipamento (ex: bola, colete, rede...)"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Buscar
        </button>
        {q && (
          <Link href="/materiais" className="rounded border border-gray-300 px-4 py-2 text-gray-600">
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
