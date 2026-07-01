import { requireUserPage } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminContaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUserPage();
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-unifique">Minha conta</h1>
      <p className="text-sm text-gray-500">
        Usuário: <strong>{user.username}</strong> · {user.name}
      </p>

      {params.erro === "atual" && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">Senha atual incorreta.</p>
      )}
      {params.erro === "curta" && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          A nova senha precisa ter pelo menos 4 caracteres.
        </p>
      )}
      {params.sucesso === "1" && (
        <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Senha alterada!</p>
      )}

      <form action={changeOwnPassword} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha atual</label>
          <input
            type="password"
            name="current"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nova senha</label>
          <input
            type="password"
            name="next"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Alterar senha
        </button>
      </form>
    </div>
  );
}
