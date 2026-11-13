import { requireUserPage } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/actions";
import AdminTopo from "@/components/admin/AdminTopo";

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
      <AdminTopo titulo="Minha conta" />
      <p className="text-sm text-gray-500">
        Usuário: <strong>{user.username}</strong> · {user.name}
      </p>

      {params.erro === "atual" && (
        <p className="aviso-erro">Senha atual incorreta.</p>
      )}
      {params.erro === "curta" && (
        <p className="aviso-erro">
          A nova senha precisa ter pelo menos 4 caracteres.
        </p>
      )}
      {params.sucesso === "1" && (
        <p className="aviso-ok">Senha alterada!</p>
      )}

      <form action={changeOwnPassword} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
        <div>
          <label className="block">
            <span className="rotulo">Senha atual</span>
            <input
              type="password"
              name="current"
              required
              className="campo"
            />
          </label>
        </div>
        <div>
          <label className="block">
            <span className="rotulo">Nova senha</span>
            <input
              type="password"
              name="next"
              required
              className="campo"
            />
          </label>
        </div>
        <button
          type="submit"
          className="btn-primario"
        >
          Alterar senha
        </button>
      </form>
    </div>
  );
}
