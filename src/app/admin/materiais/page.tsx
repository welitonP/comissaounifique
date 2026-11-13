import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMaterial, deleteMaterial, updateMaterialQuantity } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminMateriaisPage() {
  await requireUserPage();
  const materials = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Materiais (estoque)" />

      <section className="cartao">
        <h2 className="cartao-titulo">Novo material</h2>
        <form action={createMaterial} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <input
              name="name"
              placeholder="Ex: Bola de Futsal"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Categoria">
            <input
              name="category"
              placeholder="Ex: Futsal"
              className="campo"
            />
          </Campo>
          <Campo rotulo="Quantidade">
            <input
              name="quantity"
              type="number"
              defaultValue={0}
              className="campo"
            />
          </Campo>
          <Campo rotulo="Observações" opcional>
            <input
              name="notes"
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario sm:col-span-2"
          >
            Adicionar material
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="cartao">
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
                  <input aria-label="Quantidade"
                    type="number"
                    name="quantity"
                    defaultValue={m.quantity}
                    className="campo-mini w-20"
                  />
                  <button
                    type="submit"
                    className="btn-azul"
                  >
                    Salvar
                  </button>
                </form>
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" value={m.id} />
                  <BotaoApagar mensagem="Remover este material do estoque?">Remover</BotaoApagar>
                </form>
              </div>
            </div>
          </div>
        ))}
        {materials.length === 0 && <p className="vazio">Nenhum material cadastrado.</p>}
      </div>
    </div>
  );
}
