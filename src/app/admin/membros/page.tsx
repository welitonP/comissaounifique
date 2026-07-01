import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUser, deleteUser, resetUserPassword, toggleUserActive } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminMembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const me = await requireAdminPage();
  const params = await searchParams;
  const users = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Membros</h1>
      <p className="text-sm text-gray-500">
        Cada membro entra com o próprio usuário e senha. Administradores também gerenciam membros.
      </p>

      {params.erro === "usuario" && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          Já existe um membro com esse usuário.
        </p>
      )}
      {params.erro === "dados" && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          Preencha nome, usuário e uma senha de pelo menos 4 caracteres.
        </p>
      )}
      {params.sucesso === "1" && (
        <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Membro criado!</p>
      )}

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-unifique">Novo membro</h2>
        <form action={createUser} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Nome completo"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="username"
            type="text"
            placeholder="Usuário (ex: weliton.porto)"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="password"
            placeholder="Senha inicial"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
          <select name="role" className="rounded border border-gray-300 px-3 py-2">
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            type="submit"
            className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark sm:col-span-2"
          >
            Criar membro
          </button>
        </form>
      </section>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {u.name}
                  {u.role === "admin" && (
                    <span className="ml-2 rounded bg-unifique-light px-2 py-0.5 text-xs text-unifique">
                      admin
                    </span>
                  )}
                  {!u.active && (
                    <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      inativo
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{u.username}</p>
              </div>
              {u.id !== me.id && (
                <div className="flex items-center gap-3">
                  <form action={toggleUserActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="text-sm text-gray-600 hover:underline">
                      {u.active ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                  <form action={deleteUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
                      Excluir
                    </button>
                  </form>
                </div>
              )}
            </div>
            <form action={resetUserPassword} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={u.id} />
              <input
                name="password"
                placeholder="Nova senha"
                className="w-48 rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded bg-unifique-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-unifique"
              >
                Redefinir senha
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
