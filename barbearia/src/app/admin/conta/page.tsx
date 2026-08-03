import { exigirUsuarioPagina, ehDono } from "@/lib/auth";
import { trocarSenhaAction } from "@/lib/acoes-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minha conta" };

export default async function PaginaConta({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { erro, ok } = await searchParams;
  const usuario = await exigirUsuarioPagina();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="titulo text-2xl text-barba-creme">Minha conta</h1>

      <div className="card mt-6 text-sm">
        <p className="flex justify-between py-1">
          <span className="text-barba-cinza">Nome</span>
          <span className="text-barba-creme">{usuario.nome}</span>
        </p>
        <p className="flex justify-between py-1">
          <span className="text-barba-cinza">Usuário</span>
          <span className="text-barba-creme">{usuario.usuario}</span>
        </p>
        <p className="flex justify-between py-1">
          <span className="text-barba-cinza">Permissão</span>
          <span className="text-barba-creme">
            {ehDono(usuario.papel) ? "Dono (acesso total)" : "Barbeiro (só a própria agenda)"}
          </span>
        </p>
      </div>

      <form action={trocarSenhaAction} className="card mt-6 space-y-4">
        <h2 className="titulo text-barba-ouro">Trocar senha</h2>

        {ok && (
          <p className="rounded-xl border border-green-900/60 bg-green-950/30 px-3 py-2 text-sm text-green-300">
            Senha alterada.
          </p>
        )}
        {erro && (
          <p className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {erro}
          </p>
        )}

        <div>
          <label className="rotulo">Senha atual</label>
          <input type="password" name="atual" className="campo" autoComplete="current-password" required />
        </div>
        <div>
          <label className="rotulo">Nova senha</label>
          <input
            type="password"
            name="nova"
            className="campo"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="rotulo">Repita a nova senha</label>
          <input
            type="password"
            name="confirma"
            className="campo"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <button type="submit" className="btn-ouro w-full">
          Salvar nova senha
        </button>
      </form>
    </div>
  );
}
