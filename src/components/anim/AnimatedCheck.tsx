// Check de sucesso que se desenha na tela, com uma onda verde em volta.
export default function AnimatedCheck({ size = 64 }: { size?: number }) {
  return (
    <span className="relative inline-flex flex-none" style={{ width: size, height: size }} aria-hidden="true">
      <span className="check-onda absolute inset-0 rounded-full bg-green-400/40" />
      <svg viewBox="0 0 52 52" className="relative h-full w-full">
        <circle cx="26" cy="26" r="24" fill="#dcfce7" />
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          transform="rotate(-90 26 26)"
          className="check-circulo"
        />
        <path
          d="M15 27 l7 7 l15 -15"
          fill="none"
          stroke="#16a34a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="check-traco"
        />
      </svg>
    </span>
  );
}
