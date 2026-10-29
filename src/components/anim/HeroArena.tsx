import BolaQuicando from "./BolaQuicando";
import type { TipoBola } from "./Bolas";

// Fundo animado do banner da home: linhas de quadra se desenhando e uma
// bola quicando de um lado ao outro (troca de esporte a cada passada).
export default function HeroArena({ tipos }: { tipos: TipoBola[] }) {
  const linhas = [
    "M20 20 H980 V380 H20 Z", // contorno
    "M500 20 V380", // meio de quadra
    "M500 130 A70 70 0 1 1 499.9 130", // círculo central
    "M20 110 H130 V290 H20", // área esquerda
    "M980 110 H870 V290 H980", // área direita
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
      >
        {linhas.map((d) => (
          <path key={d} d={d} pathLength={1} className="linha-quadra" />
        ))}
      </svg>

      <BolaQuicando tipos={tipos} />
    </div>
  );
}
