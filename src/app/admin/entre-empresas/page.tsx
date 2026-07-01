import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createModality,
  createRegistration,
  deleteModality,
  deleteRegistration,
} from "@/lib/actions";

export default async function AdminEntreEmpresasPage() {
  await requireUserPage();
  const modalities = await prisma.modality.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { registrations: { orderBy: { companyName: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-unifique">Entre Empresas</h1>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Nova modalidade</h2>
        <form action={createModality} className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              placeholder="Nome (ex: Futsal)"
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <input
              name="order"
              type="number"
              placeholder="Ordem"
              defaultValue={0}
              className="w-24 rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <input
            name="description"
            placeholder="Descrição curta (opcional)"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <textarea
            name="info"
            placeholder="Informações / regras (opcional)"
            rows={2}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            Criar modalidade
          </button>
        </form>
      </section>

      <div className="space-y-5">
        {modalities.map((modality) => (
          <section key={modality.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-unifique">{modality.name}</h2>
                {modality.description && (
                  <p className="text-sm text-gray-600">{modality.description}</p>
                )}
              </div>
              <form action={deleteModality}>
                <input type="hidden" name="id" value={modality.id} />
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Remover modalidade
                </button>
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
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm"
                  >
                    <span>
                      <strong>{reg.companyName}</strong>
                      {reg.responsible ? ` · ${reg.responsible}` : ""}
                      {reg.contact ? ` · ${reg.contact}` : ""}
                    </span>
                    <form action={deleteRegistration}>
                      <input type="hidden" name="id" value={reg.id} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remover
                      </button>
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
                <input
                  name="companyName"
                  placeholder="Nome do atleta"
                  required
                  className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="responsible"
                  placeholder="Posição/Função"
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="contact"
                  placeholder="Contato"
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded bg-unifique-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-unifique"
                >
                  Adicionar atleta
                </button>
              </form>
            </div>
          </section>
        ))}
        {modalities.length === 0 && <p className="text-gray-500">Nenhuma modalidade criada.</p>}
      </div>
    </div>
  );
}
