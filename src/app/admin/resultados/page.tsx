import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createResult, deleteResult } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";
import BotaoApagar from "@/components/admin/BotaoApagar";
import Campo from "@/components/admin/Campo";

export const dynamic = "force-dynamic";

const MEDAL_LABEL: Record<string, string> = {
  ouro: "🥇 Ouro",
  prata: "🥈 Prata",
  bronze: "🥉 Bronze",
};

export default async function AdminResultadosPage() {
  await requireUserPage();
  const results = await prisma.result.findMany({
    orderBy: [{ year: "desc" }, { modality: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AdminTopo titulo="Resultados e conquistas" />

      <form action={createResult} className="cartao space-y-3">
        <h2 className="cartao-titulo">Novo resultado</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Evento">
            <input
              name="event"
              placeholder="Ex: 35ª OEE 2026"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Ano">
            <input
              name="year"
              type="number"
              defaultValue={new Date().getFullYear()}
              className="campo"
            />
          </Campo>
          <Campo rotulo="Modalidade">
            <input
              name="modality"
              placeholder="Ex: Futsal Masculino"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Colocação">
            <input
              name="placement"
              placeholder="Ex: Campeão, Vice, 3º lugar"
              required
              className="campo"
            />
          </Campo>
          <Campo rotulo="Medalha">
            <select name="medal" className="campo">
              <option value="">Sem medalha</option>
              <option value="ouro">🥇 Ouro</option>
              <option value="prata">🥈 Prata</option>
              <option value="bronze">🥉 Bronze</option>
            </select>
          </Campo>
          <Campo rotulo="Observação" opcional>
            <input
              name="note"
              className="campo"
            />
          </Campo>
        </div>
        <button
          type="submit"
          className="btn-primario"
        >
          Adicionar resultado
        </button>
      </form>

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.id}
            className="cartao flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <p className="font-medium">
                {r.modality} · {r.placement}
                {r.medal ? ` · ${MEDAL_LABEL[r.medal]}` : ""}
              </p>
              <p className="text-xs text-gray-500">
                {r.event}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <form action={deleteResult}>
              <input type="hidden" name="id" value={r.id} />
              <BotaoApagar mensagem="Remover este resultado?">Remover</BotaoApagar>
            </form>
          </div>
        ))}
        {results.length === 0 && <p className="vazio">Nenhum resultado cadastrado.</p>}
      </div>
    </div>
  );
}
