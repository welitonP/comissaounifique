import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <div className="brand-icon mx-auto mb-3">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12a10 10 0 0 1 14 0" />
            <path d="M8.5 15.5a5 5 0 0 1 7 0" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">Controle de instalação</h1>
        <p className="micro mt-1">Acesso restrito à equipe de campo.</p>
      </div>

      <LoginForm next={next} />
    </main>
  );
}
