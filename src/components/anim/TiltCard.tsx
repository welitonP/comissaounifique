"use client";

import { useRef } from "react";

// Card que inclina em 3D acompanhando o mouse, com um reflexo de luz.
// No celular (toque) não faz nada: fica como um card normal.
export default function TiltCard({
  children,
  className = "",
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const mover = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const s = ref.current.style;
    s.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    s.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
    s.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    s.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    s.setProperty("--glare", "1");
  };

  const sair = () => {
    const s = ref.current?.style;
    if (!s) return;
    s.setProperty("--rx", "0deg");
    s.setProperty("--ry", "0deg");
    s.setProperty("--glare", "0");
  };

  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={sair} className={`card-3d relative ${className}`}>
      {children}
      <span aria-hidden="true" className="card-3d-reflexo pointer-events-none absolute inset-0 rounded-[inherit]" />
    </div>
  );
}
