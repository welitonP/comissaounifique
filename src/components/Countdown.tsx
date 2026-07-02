"use client";

import { useEffect, useState } from "react";

function Bloco({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
      <span className="font-display text-2xl font-bold leading-none sm:text-3xl">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/75">
        {rotulo}
      </span>
    </div>
  );
}

export default function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <div className="h-[62px]" />;

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) {
    return <p className="font-display text-xl font-bold text-unifique-yellow">É hoje!</p>;
  }

  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);

  return (
    <div className="flex gap-2">
      <Bloco valor={dias} rotulo="dias" />
      <Bloco valor={horas} rotulo="horas" />
      <Bloco valor={minutos} rotulo="min" />
    </div>
  );
}
