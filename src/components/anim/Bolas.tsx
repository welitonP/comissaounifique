// Desenhos das bolas de cada esporte (SVG 32x32), usadas no banner da home.
export type TipoBola = "volei" | "futebol" | "basquete" | "tenis" | "pingpong" | "handebol";

// Descobre a bola pelo nome da modalidade cadastrada.
export function bolaDaModalidade(nome: string): TipoBola | null {
  const n = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/tenis de mesa|ping.?pong/.test(n)) return "pingpong";
  if (/futsal|futebol|society|fut7|suico/.test(n)) return "futebol";
  if (/volei/.test(n)) return "volei";
  if (/basquete|basket/.test(n)) return "basquete";
  if (/tenis|padel|squash/.test(n)) return "tenis";
  if (/handebol|handball/.test(n)) return "handebol";
  return null;
}

// Pentágonos da bola de futebol (centro + bordas)
const pent = (cx: number, cy: number, r: number, rot = -90) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((rot + i * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
const PENT_CENTRO = pent(16, 16, 5.2);
const PENT_BORDAS = [-90, -18, 54, 126, 198].map((ang) => {
  const a = (ang * Math.PI) / 180;
  return pent(16 + 14 * Math.cos(a), 16 + 14 * Math.sin(a), 4.4, ang + 180);
});

export function Bola({ tipo, className }: { tipo: TipoBola; className?: string }) {
  switch (tipo) {
    case "futebol":
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <defs>
            <clipPath id="bola-fut">
              <circle cx="16" cy="16" r="14.5" />
            </clipPath>
          </defs>
          <circle cx="16" cy="16" r="14.5" fill="#fff" />
          <g clipPath="url(#bola-fut)" stroke="#1f2937" strokeWidth="1" fill="#1f2937">
            <polygon points={PENT_CENTRO} />
            {PENT_BORDAS.map((p) => (
              <polygon key={p} points={p} />
            ))}
            {[-90, -18, 54, 126, 198].map((ang) => {
              const a = (ang * Math.PI) / 180;
              return (
                <line
                  key={ang}
                  x1={16 + 5.2 * Math.cos(a)}
                  y1={16 + 5.2 * Math.sin(a)}
                  x2={16 + 10 * Math.cos(a)}
                  y2={16 + 10 * Math.sin(a)}
                  fill="none"
                />
              );
            })}
          </g>
          <circle cx="16" cy="16" r="14.5" fill="none" stroke="#1f2937" strokeWidth="1.3" />
        </svg>
      );
    case "basquete":
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <circle cx="16" cy="16" r="14.5" fill="#f97316" stroke="#7c2d12" strokeWidth="1.3" />
          <g fill="none" stroke="#7c2d12" strokeWidth="1.3">
            <path d="M16 1.5v29M1.5 16h29" />
            <path d="M6 5.5c4 3 6 6.5 6 10.5s-2 7.5-6 10.5" />
            <path d="M26 5.5c-4 3-6 6.5-6 10.5s2 7.5 6 10.5" />
          </g>
        </svg>
      );
    case "tenis":
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <circle cx="16" cy="16" r="13" fill="#d4f53c" stroke="#84a612" strokeWidth="1" />
          <g fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5.5 7.5c4.5 3.5 4.5 13.5 0 17" />
            <path d="M26.5 7.5c-4.5 3.5-4.5 13.5 0 17" />
          </g>
        </svg>
      );
    case "pingpong":
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <circle cx="16" cy="16" r="9" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
          <circle cx="13" cy="13" r="2.5" fill="#fff" opacity="0.6" />
        </svg>
      );
    case "handebol":
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <circle cx="16" cy="16" r="14" fill="#fff" stroke="#1e3a8a" strokeWidth="1.3" />
          <path d="M16 2c-5 4-6 9-3 14s2 10-3 14" fill="none" stroke="#1e3a8a" strokeWidth="1.3" />
          <path d="M3 10c5 2 9 2 13 0s8-3 13 1" fill="#facc15" stroke="#1e3a8a" strokeWidth="1.2" />
          <path d="M4 22c5-2 9-1 12 1s8 3 12 0" fill="none" stroke="#2563eb" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" className={className}>
          <circle cx="16" cy="16" r="14.5" fill="#fff" stroke="#212492" strokeWidth="1.5" />
          <path d="M16 1.5c-3 5-3 11 0 14.5s3 9.5 0 14.5" fill="none" stroke="#00A2FF" strokeWidth="1.6" />
          <path d="M2.6 11c5.5-1 11 1 13.4 5s8 6 13.4 5" fill="none" stroke="#212492" strokeWidth="1.6" />
          <path d="M6 26c2-5 6-8.5 10-10s8-5 10-10" fill="none" stroke="#3FCFD5" strokeWidth="1.6" />
        </svg>
      );
  }
}
