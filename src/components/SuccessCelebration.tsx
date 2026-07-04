"use client";

import { useEffect, useState } from "react";

const COLORS = ["#212492", "#00A2FF", "#3FCFD5", "#F5EC5A", "#C0F021"];

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;

  type P = { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vr: number };
  const parts: P[] = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 120,
    y: H / 3,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 7 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  const start = performance.now();
  const frame = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      p.vy += 0.3; // gravidade
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 2600);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < 2600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export default function SuccessCelebration({
  active,
  message,
}: {
  active: boolean;
  message: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    setShow(true);
    fireConfetti();
    // Limpa o parâmetro da URL para não repetir ao atualizar.
    const url = new URL(window.location.href);
    if (url.search) {
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
    const t = setTimeout(() => setShow(false), 4500);
    return () => clearTimeout(t);
  }, [active]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div className="animate-[fadeInUp_0.4s_ease-out] flex items-center gap-2 rounded-full bg-unifique px-5 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/20">
        <span className="text-lg">🎉</span>
        {message}
      </div>
    </div>
  );
}
