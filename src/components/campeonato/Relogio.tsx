"use client";

import { useEffect, useState } from "react";

// Relógio do telão (hora de Brasília).
export default function Relogio() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!agora) return null;
  return (
    <span className="numeros font-placar text-4xl font-bold">
      {agora.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
