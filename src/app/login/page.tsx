import Image from "next/image";
import { loginAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo-comissao.png"
            alt="Comissão de Esportes Unifique"
            width={90}
            height={90}
            className="rounded-full"
            priority
          />
          <h1 className="mt-3 text-lg font-bold text-unifique">Comissão de Esportes Unifique</h1>
          <p className="text-sm text-gray-500">Acesso dos membros</p>
        </div>

        {params.erro === "1" && (
          <p className="aviso-erro mb-4">
            Usuário ou senha incorretos.
          </p>
        )}

        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="block">
              <span className="rotulo">Usuário</span>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="nome.sobrenome"
                className="campo"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="rotulo">Senha</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="campo"
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn-primario w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
