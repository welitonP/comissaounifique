"use client";

import { useEffect, useState } from "react";

// Botão fixo no rodapé do celular que leva ao formulário. Some quando o
// formulário já está na tela (para não cobrir os campos).
export default function StickyCta({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById(targetId);
    if (!alvo) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(!e.isIntersecting), { threshold: 0.05 });
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [targetId]);

  if (!visivel) return null;
  return (
    <a
      href={`#${targetId}`}
      className="subir-mola btn-brilho fixed inset-x-4 bottom-4 z-30 rounded-2xl bg-unifique py-3.5 text-center font-display font-semibold text-white shadow-xl shadow-unifique/30 transition active:scale-[0.98] sm:hidden"
    >
      {children}
    </a>
  );
}
