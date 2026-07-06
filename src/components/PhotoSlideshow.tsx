"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Foto = { id: string; caption: string | null; dataFmt: string };

// Slideshow simples: uma foto por vez, troca com fade a cada 5 segundos.
// Pausa com o mouse em cima e respeita quem prefere menos movimento.
export default function PhotoSlideshow({ fotos }: { fotos: Foto[] }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAtual((a) => (a + 1) % fotos.length), 5000);
    return () => clearInterval(t);
  }, [pausado, fotos.length]);

  if (fotos.length === 0) return null;

  return (
    <Link
      href="/fotos"
      className="relative block h-64 overflow-hidden rounded-2xl bg-unifique-dark shadow-sm sm:h-80"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      aria-label="Ver a galeria de fotos"
    >
      {fotos.map((f, i) => (
        <div
          key={f.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== atual}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/fotos/${f.id}`}
            alt={f.caption || "Foto da Comissão de Esportes"}
            loading={i === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white">
            {f.caption ? `${f.caption} · ` : ""}
            {f.dataFmt}
          </span>
        </div>
      ))}

      {/* bolinhas indicando a posição */}
      {fotos.length > 1 && (
        <span className="absolute right-3 top-3 flex gap-1.5">
          {fotos.map((f, i) => (
            <span
              key={f.id}
              className={`h-1.5 w-1.5 rounded-full transition ${
                i === atual ? "w-4 bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </span>
      )}
    </Link>
  );
}
