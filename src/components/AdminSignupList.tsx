"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Search, Trash2, Users } from "lucide-react";
import { deleteTournamentSignup } from "@/lib/actions";
import ConfirmButton from "@/components/ConfirmButton";

export type AdminSignup = {
  id: string;
  name: string;
  phone: string;
  category: string | null;
  note: string | null;
  answers: [string, string][];
  createdAt: string; // já formatado
};

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

// Link de WhatsApp a partir do telefone digitado (acrescenta o 55 se faltar).
function linkWhatsApp(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}`;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function AdminSignupList({
  signups,
  categories,
}: {
  signups: AdminSignup[];
  categories: string[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState<string>("todas");

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    const qDigitos = busca.replace(/\D/g, "");
    return signups.filter((s) => {
      if (filtroCat !== "todas") {
        if (filtroCat === "__sem" ? s.category && categories.includes(s.category) : s.category !== filtroCat) {
          return false;
        }
      }
      if (!q) return true;
      return (
        normalizar(s.name).includes(q) ||
        (qDigitos.length >= 3 && s.phone.replace(/\D/g, "").includes(qDigitos)) ||
        s.answers.some(([, a]) => normalizar(a).includes(q))
      );
    });
  }, [busca, filtroCat, signups, categories]);

  // Agrupa por categoria (na ordem definida) quando o torneio usa categorias.
  const grupos = useMemo(() => {
    if (categories.length === 0) return [{ cat: null as string | null, itens: filtrados }];
    const g = categories.map((c) => ({ cat: c as string | null, itens: filtrados.filter((s) => s.category === c) }));
    const sem = filtrados.filter((s) => !s.category || !categories.includes(s.category));
    if (sem.length) g.push({ cat: "Sem categoria", itens: sem });
    return g.filter((x) => x.itens.length > 0 || (filtroCat === "todas" && !busca));
  }, [filtrados, categories, filtroCat, busca]);

  if (signups.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center">
        <Users size={32} className="mx-auto text-gray-300" />
        <p className="mt-2 font-display font-semibold text-gray-700">Ninguém inscrito ainda</p>
        <p className="text-sm text-gray-500">Compartilhe o link do torneio para a galera se inscrever.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca e filtro */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou resposta..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-unifique focus:outline-none focus:ring-2 focus:ring-unifique/15"
          />
        </label>
        {categories.length > 0 && (
          <select
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-unifique focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__sem">Sem categoria</option>
          </select>
        )}
      </div>

      {filtrados.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500 shadow-sm">
          Nenhum inscrito encontrado para essa busca.
        </p>
      )}

      {grupos.map((g) => (
        <div key={g.cat ?? "todos"} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {g.cat && (
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-unifique">{g.cat}</p>
              <span className="rounded-full bg-unifique px-2 py-0.5 text-xs font-bold text-white">
                {g.itens.length}
              </span>
            </div>
          )}
          {g.itens.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">Ninguém nesta categoria.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {g.itens.map((s) => {
                const wa = linkWhatsApp(s.phone);
                return (
                  <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-unifique-light text-sm font-bold text-unifique">
                      {iniciais(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        {s.category && categories.length > 0 && filtroCat === "todas" && !g.cat && (
                          <span className="rounded-full bg-unifique-light px-2 py-0.5 text-[11px] font-semibold text-unifique">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{s.phone}</p>
                      {s.answers.length > 0 && (
                        <dl className="mt-1.5 grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                          {s.answers.map(([q, a]) => (
                            <div key={q} className="min-w-0">
                              <dt className="inline text-gray-500">{/[?:]$/.test(q) ? q : `${q}:`} </dt>
                              <dd className="inline font-medium text-gray-800">{a}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {s.note && (
                        <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                          {s.note}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">Inscrito em {s.createdAt}</p>
                    </div>
                    <div className="flex flex-none items-center gap-1">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chamar no WhatsApp"
                          className="rounded-lg p-2 text-green-600 transition hover:bg-green-50"
                        >
                          <MessageCircle size={18} />
                        </a>
                      )}
                      <form action={deleteTournamentSignup}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmButton
                          message={`Remover a inscrição de ${s.name}?`}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
