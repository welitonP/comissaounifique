import type { TimeCompleto } from "@/lib/campeonato/dados";

// Escudo do time: círculo na cor do time com as iniciais.
export function Escudo({ time, size = 32 }: { time: Pick<TimeCompleto, "name" | "color"> | null | undefined; size?: number }) {
  if (!time) {
    return (
      <span
        className="inline-flex flex-none items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-[10px] font-bold text-gray-400 dark:border-slate-600"
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }
  const iniciais = time.name
    .split(/\s+/)
    .filter((p) => p.length > 0 && !/^(de|da|do|dos|das|e)$/i.test(p))
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const claro = corClara(time.color);
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full font-display font-bold shadow-sm ring-2 ring-white dark:ring-slate-800"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.36),
        background: `linear-gradient(135deg, ${time.color}, ${ajustar(time.color, -30)})`,
        color: claro ? "#181a6e" : "#fff",
      }}
      title={time.name}
    >
      {iniciais || "?"}
    </span>
  );
}

function corClara(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length !== 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

function ajustar(hex: string, d: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const c = (i: number) => Math.min(255, Math.max(0, parseInt(m.slice(i, i + 2), 16) + d)).toString(16).padStart(2, "0");
  return `#${c(0)}${c(2)}${c(4)}`;
}

export function StatusJogo({ status }: { status: string }) {
  if (status === "ao_vivo") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
        <span className="ao-vivo-ponto h-1.5 w-1.5 rounded-full bg-white" />
        Ao vivo
      </span>
    );
  }
  if (status === "encerrado") {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-slate-700 dark:text-slate-300">
        Encerrado
      </span>
    );
  }
  if (status === "folga") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        Passa direto
      </span>
    );
  }
  return (
    <span className="rounded-full bg-unifique-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-unifique dark:bg-unifique/30 dark:text-unifique-teal">
      Agendado
    </span>
  );
}

export function StatusCampeonato({ status, aoVivo, claro }: { status: string; aoVivo?: boolean; claro?: boolean }) {
  if (aoVivo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow">
        <span className="ao-vivo-ponto h-2 w-2 rounded-full bg-white" />
        Jogo ao vivo
      </span>
    );
  }
  const mapa: Record<string, [string, string]> = {
    rascunho: ["Em montagem", claro ? "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300" : "bg-white/20 text-white"],
    andamento: ["Em andamento", "bg-unifique-green text-unifique-dark"],
    encerrado: ["Encerrado", "bg-unifique-yellow text-unifique-dark"],
  };
  const [rotulo, cls] = mapa[status] ?? mapa.rascunho;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${cls}`}>{rotulo}</span>;
}
