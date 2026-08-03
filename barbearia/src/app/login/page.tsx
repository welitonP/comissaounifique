import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { loginAction } from "@/lib/acoes-admin";
import { IconeTesoura } from "@/components/Icones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; proximo?: string }>;
}) {
  const { erro, proximo } = await searchParams;
  if (await usuarioAtual()) redirect("/admin");
  const config = await getConfig();

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-barba-ouro text-black">
            <IconeTesoura className="h-6 w-6" />
          </span>
          <h1 className="titulo mt-4 text-2xl text-barba-creme">{config.nome}</h1>
          <p className="text-sm text-barba-cinza">Área do barbeiro</p>
        </div>

        <form action={loginAction} className="card mt-6 space-y-4">
          <input type="hidden" name="proximo" value={proximo || "/admin"} />

          <div>
            <label className="rotulo" htmlFor="usuario">
              Usuário
            </label>
            <input id="usuario" name="usuario" className="campo" autoComplete="username" required autoFocus />
          </div>

          <div>
            <label className="rotulo" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              className="campo"
              autoComplete="current-password"
              required
            />
          </div>

          {erro && (
            <p className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              Usuário ou senha incorretos.
            </p>
          )}

          <button type="submit" className="btn-ouro w-full py-3">
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-barba-cinza">
          <Link href="/" className="hover:text-barba-ouro">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
