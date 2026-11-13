import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createModality,
  createRegistration,
  deleteModality,
  deleteRegistration,
} from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export default async function AdminEntreEmpresasPage() {
  await requireUserPage();
  const modalities = await prisma.modality.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { registrations: { orderBy: { companyName: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <AdminTopo titulo="Entre Empresas" />

      <section className="cartao">
        <h2 className="cartao-titulo">Nova modalidade</h2>
        <form action={createModality} className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            <Campo rotulo="Nome" className="flex-1">
              <input
                name="name"
                placeholder="Ex: Futsal"
                required
                className="campo"
              />
            </Campo>
            <Campo rotulo="Ordem" className="w-24">
              <input
                name="order"
                type="number"
                defaultValue={0}
                className="campo"
              />
            </Campo>
          </div>
          <Campo rotulo="Descrição curta" opcional>
            <input
              name="description"
              className="campo"
            />
          </Campo>
          <Campo rotulo="Informações / regras" opcional>
            <textarea
              name="info"
              rows={2}
              className="campo"
            />
          </Campo>
          <button
            type="submit"
            className="btn-primario"
          >
            Criar modalidade
          </button>
        </form>
      </section>

      <div className="space-y-5">
        {modalities.map((modality) => (
          <section key={modality.id} className="cartao">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-unifique">{modality.name}</h2>
                {modality.description && (
                  <p className="text-sm text-gray-600">{modality.description}</p>
                )}
              </div>
              <form action={deleteModality}>
                <input type="hidden" name="id" value={modality.id} />
                <BotaoApagar mensagem="Remover esta modalidade? O elenco dela também é apagado. Não dá para desfazer.">Remover</BotaoApagar>
              </form>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-500">
                Nosso elenco ({modality.registrations.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {modality.registrations.map((reg) => (
                  <li
                    key={reg.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 py-1 pl-3 pr-1 text-sm"
                  >
                    <span className="min-w-0 break-words">
                      <strong>{reg.companyName}</strong>
                      {reg.responsible ? ` · ${reg.responsible}` : ""}
                      {reg.contact ? ` · ${reg.contact}` : ""}
                    </span>
                    <form action={deleteRegistration}>
                      <input type="hidden" name="id" value={reg.id} />
                      <BotaoApagar mensagem="Tirar este atleta do elenco?">Remover</BotaoApagar>
                    </form>
                  </li>
                ))}
                {modality.registrations.length === 0 && (
                  <li className="text-sm text-gray-400">Nenhum atleta.</li>
                )}
              </ul>

              <form
                action={createRegistration}
                className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3"
              >
                <input type="hidden" name="modalityId" value={modality.id} />
                <input aria-label="Nome do atleta"
                  name="companyName"
                  placeholder="Nome do atleta"
                  required
                  className="campo-mini flex-1"
                />
                <input aria-label="Posição/Função"
                  name="responsible"
                  placeholder="Posição/Função"
                  className="campo-mini"
                />
                <input aria-label="Contato"
                  name="contact"
                  placeholder="Contato"
                  className="campo-mini"
                />
                <button
                  type="submit"
                  className="btn-azul"
                >
                  Adicionar atleta
                </button>
              </form>
            </div>
          </section>
        ))}
        {modalities.length === 0 && <p className="vazio">Nenhuma modalidade criada.</p>}
      </div>
    </div>
  );
}
