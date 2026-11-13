import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrackedItem, deleteTrackedItem, returnTrackedItem } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminUniformesPage() {
  await requireUserPage();
  const items = await prisma.trackedItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Uniformes e itens controlados" />
      <p className="text-sm text-gray-500">
        Cadastre aqui os itens (bolsas, uniformes...). Para registrar quem pegou/devolveu, use a
        página <span className="font-medium">Uniformes</span> no menu.
      </p>

      <section className="cartao">
        <h2 className="cartao-titulo">Novo item</h2>
        <form action={createTrackedItem} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome" className="sm:col-span-2">
            <input
              name="name"
              placeholder="Ex: Bolsa uniforme masculino futsal"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Categoria">
            <input
              name="category"
              placeholder="Ex: Uniforme Futsal"
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
            Adicionar item
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="cartao flex flex-wrap items-center justify-between gap-3"
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
                  <button type="submit" className="inline-flex min-h-[38px] items-center rounded-xl px-3 py-2 text-sm font-semibold text-unifique-blue transition hover:bg-unifique-light dark:hover:bg-white/5">
                    Marcar devolvido
                  </button>
                </form>
              )}
              <form action={deleteTrackedItem}>
                <input type="hidden" name="id" value={item.id} />
                <BotaoApagar mensagem="Remover este item da lista de uniformes?">Remover</BotaoApagar>
              </form>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="vazio">Nenhum item cadastrado.</p>}
      </div>
    </div>
  );
}
