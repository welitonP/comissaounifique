import ConfirmButton from "@/components/ConfirmButton";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addCheckoutItem,
  createCheckout,
  createKit,
  deleteCheckout,
  deleteCheckoutItem,
  deleteKit,
  setCheckoutStatus,
  toggleCheckoutItem,
} from "@/lib/actions";
import { fmtData, fmtDataHora } from "@/lib/datas";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

export default async function AdminSaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const params = await searchParams;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [kits, eventos, checkouts] = await Promise.all([
    prisma.equipmentKit.findMany({ orderBy: { name: "asc" } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 40,
    }),
    prisma.checkout.findMany({
      orderBy: { date: "desc" },
      include: { items: { orderBy: { id: "asc" } } },
    }),
  ]);

  const abertas = checkouts.filter((c) => c.status === "aberto");
  const devolvidas = checkouts.filter((c) => c.status === "devolvido");

  const ToggleBtn = ({
    id,
    field,
    active,
    label,
    activeClass,
  }: {
    id: string;
    field: string;
    active: boolean;
    label: string;
    activeClass: string;
  }) => (
    <form action={toggleCheckoutItem}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          active ? activeClass : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
      >
        {active ? "✓ " : ""}
        {label}
      </button>
    </form>
  );

  return (
    <div className="space-y-8">
      <div>
        <AdminTopo titulo="Saídas de equipamento" />
        <p className="text-sm text-gray-500">
          Controle o que sai para cada jogo e o que já voltou.
        </p>
      </div>

      {params.sucesso === "1" && (
        <p className="aviso-ok">
          Saída criada! Marque os itens conforme leva e devolve.
        </p>
      )}
      {params.erro === "dados" && (
        <p className="aviso-erro">
          Escolha um jogo (ou informe título e data).
        </p>
      )}

      {/* Nova saída */}
      <section className="cartao">
        <h2 className="cartao-titulo">Nova saída</h2>
        <form action={createCheckout} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block">
              <span className="rotulo">Jogo do calendário</span>
              <select name="eventId" className="campo">
                <option value="">Selecione um jogo...</option>
                {eventos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {fmtData(e.date)} · {e.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-gray-400">
              Sem jogo na lista? Preencha título e data abaixo.
            </p>
          </div>
          <Campo rotulo="Título">
            <input
              name="title"
              placeholder="Se não escolher jogo"
              className="campo"
            />
          </Campo>
          <Campo rotulo="Data e hora">
            <input
              type="datetime-local"
              name="date"
              className="campo"
            />
          </Campo>
          <Campo rotulo="Kit de equipamentos">
            <select name="kitId" className="campo">
              <option value="">Sem kit (lista vazia)</option>
              {kits.map((k) => (
                <option key={k.id} value={k.id}>
                  Kit: {k.name}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Responsável" opcional>
            <input
              name="responsible"
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario sm:col-span-2"
          >
            Criar saída
          </button>
        </form>
      </section>

      {/* Saídas em aberto */}
      <section>
        <h2 className="cartao-titulo mb-2">Em aberto ({abertas.length})</h2>
        {abertas.length === 0 && (
          <p className="cartao text-sm text-gray-500">
            Nenhuma saída em aberto.
          </p>
        )}
        <div className="space-y-4">
          {abertas.map((c) => {
            const atrasada = new Date(c.date) < now;
            const faltaVoltar = c.items.filter((i) => i.taken && !i.returned).length;
            return (
              <div
                key={c.id}
                className={`rounded-xl bg-white p-4 shadow-sm ${
                  atrasada ? "ring-2 ring-red-200" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="cartao-titulo">{c.title}</p>
                    <p className="text-sm text-gray-500">
                      {fmtDataHora(c.date)}
                      {c.responsible ? ` · resp: ${c.responsible}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {faltaVoltar > 0 && (
                      <span className="aviso-info rounded-full px-2 py-0.5 text-xs font-semibold">
                        {faltaVoltar} p/ voltar
                      </span>
                    )}
                    <form action={setCheckoutStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="devolvido" />
                      <button
                        type="submit"
                        className="btn-azul"
                      >
                        Concluir
                      </button>
                    </form>
                    <form action={deleteCheckout}>
                      <input type="hidden" name="id" value={c.id} />
                      <BotaoApagar mensagem="Apagar esta saída de equipamento? Não dá para desfazer.">Excluir</BotaoApagar>
                    </form>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-gray-50">
                  {c.items.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span
                        className={`flex-1 text-sm ${
                          it.returned ? "text-gray-400 line-through" : "text-gray-800"
                        }`}
                      >
                        {it.name}
                      </span>
                      <ToggleBtn
                        id={it.id}
                        field="taken"
                        active={it.taken}
                        label="Levou"
                        activeClass="bg-green-100 text-green-700"
                      />
                      <ToggleBtn
                        id={it.id}
                        field="returned"
                        active={it.returned}
                        label="Devolveu"
                        activeClass="bg-unifique-blue/15 text-unifique-blue"
                      />
                      <form action={deleteCheckoutItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <ConfirmButton
                          message="Tirar este item da saída?"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        >
                          <span aria-hidden="true">✕</span>
                          <span className="sr-only">Tirar item</span>
                        </ConfirmButton>
                      </form>
                    </li>
                  ))}
                  {c.items.length === 0 && (
                    <li className="py-2 text-sm text-gray-400">Sem itens. Adicione abaixo.</li>
                  )}
                </ul>

                <form action={addCheckoutItem} className="mt-2 flex gap-2">
                  <input type="hidden" name="checkoutId" value={c.id} />
                  <input aria-label="Adicionar item"
                    name="name"
                    placeholder="Adicionar item (ex: Água, Colete...)"
                    className="campo-mini flex-1"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-unifique-light px-3 py-1.5 text-sm font-medium text-unifique hover:bg-unifique-blue/10"
                  >
                    Adicionar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      {/* Kits padrão */}
      <section className="cartao">
        <h2 className="cartao-titulo">Kits padrão</h2>
        <p className="text-sm text-gray-500">
          Monte uma vez a lista de cada modalidade. Um item por linha.
        </p>
        <form action={createKit} className="mt-3 space-y-2">
          <Campo rotulo="Nome do kit">
            <input
              name="name"
              placeholder="Ex: Kit Futsal"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Itens">
            <textarea
              name="items"
              required
              rows={4}
              placeholder={"Uniformes\nBolsa de bolas (5 bolas)\nKit primeiros socorros\nÁgua\nColetes"}
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario"
          >
            Salvar kit
          </button>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {kits.map((k) => (
            <div key={k.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="cartao-titulo">{k.name}</p>
                <form action={deleteKit}>
                  <input type="hidden" name="id" value={k.id} />
                  <BotaoApagar mensagem="Apagar este kit padrão?">Remover</BotaoApagar>
                </form>
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                {k.items
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
              </ul>
            </div>
          ))}
          {kits.length === 0 && <p className="text-sm text-gray-400">Nenhum kit criado ainda.</p>}
        </div>
      </section>

      {/* Histórico */}
      {devolvidas.length > 0 && (
        <section>
          <h2 className="cartao-titulo mb-2">Concluídas</h2>
          <div className="space-y-2">
            {devolvidas.map((c) => (
              <div
                key={c.id}
                className="cartao flex flex-wrap items-center justify-between gap-2 opacity-80"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-500">
                    {fmtData(c.date)} · {c.items.length} itens · devolvido
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={setCheckoutStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="aberto" />
                    <button type="submit" className="text-sm text-unifique-blue hover:underline">
                      Reabrir
                    </button>
                  </form>
                  <form action={deleteCheckout}>
                    <input type="hidden" name="id" value={c.id} />
                    <BotaoApagar mensagem="Apagar esta saída de equipamento? Não dá para desfazer.">Excluir</BotaoApagar>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
