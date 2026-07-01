import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrackedItem, deleteTrackedItem, returnTrackedItem } from "@/lib/actions";

export default async function AdminUniformesPage() {
  await requireUserPage();
  const items = await prisma.trackedItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Uniformes e itens controlados</h1>
      <p className="text-sm text-gray-500">
        Cadastre aqui os itens (bolsas, uniformes...). Para registrar quem pegou/devolveu, use a
        página <span className="font-medium">Uniformes</span> no menu.
      </p>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo item</h2>
        <form action={createTrackedItem} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Nome (ex: Bolsa uniforme masculino futsal)"
            required
            className="rounded border border-gray-300 px-3 py-2 sm:col-span-2"
          />
          <input
            name="category"
            placeholder="Categoria (ex: Uniforme Futsal)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="notes"
            placeholder="Observações (opcional)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark sm:col-span-2"
          >
            Adicionar item
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-sm"
          >
            <div>
              <p className="font-medium">
                {item.name}
                {item.category && (
                  <span className="ml-2 rounded bg-unifique-light px-2 py-0.5 text-xs text-unifique">
                    {item.category}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {item.holderName ? `Com ${item.holderName}` : "Disponível"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {item.holderName && (
                <form action={returnTrackedItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-sm text-unifique-blue hover:underline">
                    Marcar devolvido
                  </button>
                </form>
              )}
              <form action={deleteTrackedItem}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Remover
                </button>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">Nenhum item cadastrado.</p>}
      </div>
    </div>
  );
}
