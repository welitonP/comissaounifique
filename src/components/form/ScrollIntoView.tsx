"use client";

import { useEffect, useRef } from "react";

// Ao aparecer (ex: mensagem de sucesso/erro depois de enviar), rola a tela até
// aqui, para a pessoa ver o resultado sem procurar.
export default function ScrollIntoView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
