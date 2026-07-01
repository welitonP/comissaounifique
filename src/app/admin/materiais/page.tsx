import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMaterial, deleteMaterial, updateMaterialQuantity } from "@/lib/actions";

export default async function AdminMateriaisPage() {
  await requireAdminPage();
  const materials = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Materiais (estoque)</h1>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo material</h2>
        <form action={createMaterial} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Nome (ex: Bola de Futsal)"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="category"
            placeholder="Categoria (ex: Futsal)"
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="quantity"
            type="number"
            placeholder="Quantidade"
            defaultValue={0}
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
            Adicionar material
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="rounded-lg bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {m.name}
                  {m.category ? (
                    <span className="ml-2 rounded bg-unifique-light px-2 py-0.5 text-xs text-unifique">
                      {m.category}
                    </span>
                  ) : null}
                </p>
                {m.notes && <p className="text-xs text-gray-500">{m.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <form action={updateMaterialQuantity} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={m.quantity}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded bg-unifique-blue px-3 py-1 text-sm font-medium text-white hover:bg-unifique"
                  >
                    Salvar
                  </button>
                </form>
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Remover
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {materials.length === 0 && <p className="text-gray-500">Nenhum material cadastrado.</p>}
      </div>
    </div>
  );
}
