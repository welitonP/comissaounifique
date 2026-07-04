import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommissionMember } from "@/lib/actions";
import CommissionMemberRow from "@/components/CommissionMemberRow";

export const dynamic = "force-dynamic";

export default async function AdminComissaoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUserPage();
  const params = await searchParams;
  const membros = await prisma.commissionMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">A Comissão (membros)</h1>

      {params.erro === "foto" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          A foto precisa ser uma imagem de até 2MB.
        </p>
      )}
      {params.erro === "dados" && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          Preencha nome e função do membro.
        </p>
      )}
      {params.sucesso === "editado" && (
        <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          Membro atualizado com sucesso.
        </p>
      )}

      <form action={createCommissionMember} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo membro</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Nome"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="role"
            placeholder="Função (ex: Coordenador de Futsal)"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="whatsapp"
            placeholder="WhatsApp com DDD (ex: 47999998888)"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <div>
            <label className="block text-xs font-medium text-gray-500">
              Ordem de exibição (0 aparece primeiro)
            </label>
            <input
              name="order"
              type="number"
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Foto (opcional)</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Adicionar membro
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {membros.map((m) => (
          <CommissionMemberRow
            key={m.id}
            member={{
              id: m.id,
              name: m.name,
              role: m.role,
              whatsapp: m.whatsapp,
              order: m.order,
              photoMime: m.photoMime,
            }}
          />
        ))}
        {membros.length === 0 && <p className="text-gray-500">Nenhum membro cadastrado.</p>}
      </div>
    </div>
  );
}
