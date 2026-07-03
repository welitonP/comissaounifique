import { Download } from "lucide-react";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminExportarPage() {
  await requireUserPage();
  const modalities = await prisma.modality.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { registrations: true } } },
  });
  const total = modalities.reduce((s, m) => s + m._count.registrations, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-unifique">Exportar dados</h1>
        <p className="text-sm text-gray-500">
          Baixe a lista de atletas do elenco em planilha (CSV, abre no Excel). Filtre por modalidade
          ou exporte tudo.
        </p>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-unifique">Elenco por modalidade</h2>
        <form method="get" action="/api/export/elenco" className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Modalidade</label>
            <select
              name="modality"
              defaultValue="all"
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="all">Todas as modalidades ({total})</option>
              {modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m._count.registrations})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
          >
            <Download size={18} /> Baixar CSV
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-400">
          O arquivo traz nome, modalidade, data de nascimento e telefone dos atletas. Trate esses
          dados conforme a Política de Privacidade (LGPD).
        </p>
      </section>
    </div>
  );
}
