// Fundo animado do banner da home: linhas de quadra se desenhando e uma
// bola quicando de um lado ao outro. Só CSS (sem JavaScript) e decorativo.
export default function HeroArena() {
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

      {/* bola */}
      <div className="bola-trilho absolute bottom-1 h-28 w-9">
        <div className="bola-sombra absolute bottom-0 left-1 h-1.5 w-7 rounded-full bg-black/60 blur-[1px]" />
        <div className="bola-quique absolute bottom-1.5 left-0.5">
          <svg viewBox="0 0 32 32" className="bola-giro h-8 w-8 drop-shadow-md">
            <circle cx="16" cy="16" r="14.5" fill="#fff" stroke="#212492" strokeWidth="1.5" />
            <path d="M16 1.5c-3 5-3 11 0 14.5s3 9.5 0 14.5" fill="none" stroke="#00A2FF" strokeWidth="1.6" />
            <path d="M2.6 11c5.5-1 11 1 13.4 5s8 6 13.4 5" fill="none" stroke="#212492" strokeWidth="1.6" />
            <path d="M6 26c2-5 6-8.5 10-10s8-5 10-10" fill="none" stroke="#3FCFD5" strokeWidth="1.6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
