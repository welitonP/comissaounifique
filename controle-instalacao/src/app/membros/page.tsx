import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { MemberForms } from "@/components/MemberForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membros" };

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="app-shell">
      <TopBar session={session} subtitle="Membros" />

      <section className="page-heading">
        <div>
          <p className="eyebrow">Acesso</p>
          <h1>Quem pode entrar no controle</h1>
          <p>
            Cada pessoa tem usuário e senha próprios — é o nome dela que aparece no
            histórico de alterações.
          </p>
        </div>
      </section>

      <MemberForms
        currentUserId={session.userId}
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          active: user.active,
        }))}
      />
    </main>
  );
}
