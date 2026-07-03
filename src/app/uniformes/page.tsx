import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUserPage } from "@/lib/auth";
import { lendTrackedItem, returnTrackedItem } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function UniformesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Controle de uniformes é restrito à comissão (reforço além do middleware).
  await requireUserPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const user = await getCurrentUser();

  const items = await prisma.trackedItem.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { holderName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const comAlguem = items.filter((i) => i.holderName).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-unifique">Uniformes e itens controlados</h1>
          <p className="mt-1 text-gray-600">
            Registre quem está com cada bolsa/uniforme para não perder o controle.
          </p>
        </div>
        <span className="rounded-full bg-unifique-light px-4 py-1 text-sm font-medium text-unifique">
          {comAlguem} emprestado(s) · {items.length} no total
        </span>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por item, categoria ou pessoa..."
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Buscar
        </button>
        {q && (
          <Link href="/uniformes" className="rounded border border-gray-300 px-4 py-2 text-gray-600">
            Limpar
          </Link>
        )}
      </form>

      {items.length === 0 && (
        <p className="text-gray-500">
          {q ? "Nenhum item encontrado para a busca." : "Nenhum item cadastrado ainda."}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {item.name}
                  {item.category && (
                    <span className="ml-2 rounded bg-unifique-light px-2 py-0.5 text-xs text-unifique">
                      {item.category}
                    </span>
                  )}
                </p>
                {item.holderName ? (
                  <p className="mt-1 text-sm text-orange-700">
                    🟠 Com <strong>{item.holderName}</strong>
                    {item.since
                      ? ` desde ${new Date(item.since).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-green-700">🟢 Disponível na comissão</p>
                )}
                {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
              </div>

              <div>
                {item.holderName ? (
                  <form action={returnTrackedItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="rounded bg-unifique-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-unifique"
                    >
                      Devolver
                    </button>
                  </form>
                ) : (
                  <form action={lendTrackedItem} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      name="holderName"
                      defaultValue={user?.name ?? ""}
                      placeholder="Nome de quem pegou"
                      required
                      className="w-44 rounded border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded bg-unifique px-3 py-1.5 text-sm font-medium text-white hover:bg-unifique-dark"
                    >
                      Peguei
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
