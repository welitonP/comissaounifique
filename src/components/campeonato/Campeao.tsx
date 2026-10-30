"use client";

import { useEffect } from "react";
import { Medal, Trophy } from "lucide-react";

const CORES = ["#212492", "#00A2FF", "#3FCFD5", "#F5EC5A", "#C0F021"];

// Chuva de confete (uma vez por sessão para cada campeonato).
function confete() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 180 }, (_, i) => ({
    x: i % 2 ? -10 : W + 10,
    y: H * 0.6,
    vx: (i % 2 ? 1 : -1) * (Math.random() * 9 + 4),
    vy: -(Math.random() * 15 + 8),
    s: Math.random() * 7 + 4,
    c: CORES[i % CORES.length],
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.35,
  }));
  const ini = performance.now();
  const passo = (agora: number) => {
    const t = agora - ini;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - t / 3200);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    }
    if (t < 3200) requestAnimationFrame(passo);
    else canvas.remove();
  };
  requestAnimationFrame(passo);
}

type T = { name: string; color: string } | null;

export default function Campeao({ cupId, campeao, vice, terceiro }: { cupId: string; campeao: T; vice: T; terceiro: T }) {
  useEffect(() => {
    try {
      const k = `campeao-${cupId}-${campeao?.name}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* sem storage: solta o confete mesmo assim */
    }
    const t = setTimeout(confete, 350);
    return () => clearTimeout(t);
  }, [cupId, campeao?.name]);

  if (!campeao) return null;

  return (
    <section className="entrada-sucesso relative overflow-hidden rounded-3xl bg-gradient-to-br from-unifique-dark via-unifique to-unifique-blue p-6 text-center text-white shadow-xl sm:p-8">
      <div aria-hidden className="raios-trofeu pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-unifique-yellow">Campeão</p>
        <div className="trofeu-pulo mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-unifique-yellow to-amber-500 shadow-[0_0_60px_rgba(245,236,90,0.55)]">
          <Trophy size={50} className="text-unifique-dark" strokeWidth={2.2} />
        </div>
        <h2 className="titulo-reflexo mt-4 font-display text-3xl font-extrabold sm:text-4xl">{campeao.name}</h2>
      </div>
      {(vice || terceiro) && (
        <div className="relative mt-5 flex flex-wrap justify-center gap-3 text-sm">
          {vice && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-semibold backdrop-blur">
              <Medal size={16} className="text-slate-200" /> 2º {vice.name}
            </span>
          )}
          {terceiro && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-semibold backdrop-blur">
              <Medal size={16} className="text-amber-600" /> 3º {terceiro.name}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
