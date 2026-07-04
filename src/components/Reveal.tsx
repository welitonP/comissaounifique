"use client";

import { useEffect, useRef, useState } from "react";

// Revela o conteúdo com um fade/slide suave quando ele entra na tela.
// À prova de falhas: se já estiver visível na tela ou se algo der errado,
// o conteúdo aparece do mesmo jeito (nunca fica escondido).
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reveal = () => setShown(true);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (prefersReduced || !el || !("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    // Já está na área visível? Revela agora (o fade ainda acontece).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      reveal();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal();
            obs.disconnect();
          }
        }),
      { threshold: 0.12 },
    );
    obs.observe(el);

    // Rede de segurança: nunca deixa o conteúdo invisível.
    const fallback = setTimeout(reveal, 1500);
    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
