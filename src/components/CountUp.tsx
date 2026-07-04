"use client";

import { useEffect, useRef, useState } from "react";

// Anima um número de 0 até o valor quando entra na tela.
// À prova de falhas: se já estiver visível ou se o observer não disparar,
// mostra o valor final mesmo assim (nunca fica preso no 0).
export default function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || value === 0) {
      setDisplay(value);
      return;
    }
    const el = ref.current;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setDisplay(Math.round(eased * value));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!el || !("IntersectionObserver" in window)) {
      run();
      return;
    }
    // Já visível? Anima já.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      run();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 },
    );
    obs.observe(el);
    // Rede de segurança: garante que o número final apareça.
    const fallback = setTimeout(() => setDisplay((d) => (d === 0 ? value : d)), 1500);
    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}
