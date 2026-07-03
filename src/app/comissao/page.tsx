import { MessageCircle, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function waLink(numero: string): string {
  let d = numero.replace(/\D/g, "");
  if (d.length <= 11) d = `55${d}`; // adiciona código do Brasil se veio só com DDD
  return `https://wa.me/${d}`;
}

export default async function ComissaoPage() {
  const membros = await prisma.commissionMember.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-unifique to-unifique-blue p-7 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Users size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">A Comissão</h1>
            <p className="text-sm text-white/85">Quem faz o esporte acontecer na Unifique.</p>
          </div>
        </div>
      </section>

      {membros.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Os membros da comissão serão apresentados aqui em breve.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {membros.map((m) => (
            <div
              key={m.id}
              className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm"
            >
              {m.photoMime ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/comissao-foto/${m.id}`}
                  alt={m.name}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-unifique-light"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-unifique text-2xl font-bold text-white">
                  {iniciais(m.name)}
                </div>
              )}
              <h2 className="mt-3 font-display font-semibold text-gray-800">{m.name}</h2>
              <p className="text-sm text-unifique-blue">{m.role}</p>
              {m.whatsapp && (
                <a
                  href={waLink(m.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-105"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
