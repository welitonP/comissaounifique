import { loginAction } from "@/lib/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-unifique-dark">Acesso da Comissão</h1>
      <p className="mt-1 text-sm text-gray-500">
        Área restrita para gestão de times, jogos, comunicados e enquetes.
      </p>

      {params.erro === "1" && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">Senha incorreta.</p>
      )}

      <form action={loginAction} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            name="password"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-unifique px-4 py-2 font-medium text-white hover:bg-unifique-dark"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
