"use client";

import { useRouter } from "next/navigation";

// "Meu time": escolhe uma equipe e mostra só os jogos dela.
export default function TimeFiltro({
  times,
  atual,
  base,
}: {
  times: { id: string; name: string }[];
  atual?: string;
  base: string; // URL sem o parâmetro time (ex: /campeonatos/x?aba=jogos)
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-sm dark:bg-slate-800">
      <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-gray-400">Meu time</span>
      <select
        value={atual ?? ""}
        onChange={(e) => router.push(e.target.value ? `${base}&time=${e.target.value}` : base, { scroll: false })}
        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm font-semibold text-unifique outline-none dark:text-unifique-teal"
      >
        <option value="">Todos os jogos</option>
        {times.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
