import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommissionMember, deleteCommissionMember } from "@/lib/actions";

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
          <input
            name="order"
            type="number"
            placeholder="Ordem"
            defaultValue={0}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
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
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
          >
            {m.photoMime ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/comissao-foto/${m.id}`}
                alt={m.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-unifique-light text-sm font-bold text-unifique">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-gray-500">{m.role}</p>
            </div>
            <form action={deleteCommissionMember}>
              <input type="hidden" name="id" value={m.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Remover
              </button>
            </form>
          </div>
        ))}
        {membros.length === 0 && <p className="text-gray-500">Nenhum membro cadastrado.</p>}
      </div>
    </div>
  );
}
