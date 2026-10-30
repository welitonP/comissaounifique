"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Atualiza a página sozinha (placar ao vivo) enquanto a aba está visível.
export default function AutoRefresh({ segundos = 20, aoVivo = false }: { segundos?: number; aoVivo?: boolean }) {
  const router = useRouter();
  const [restante, setRestante] = useState(segundos);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setRestante((r) => {
        if (r <= 1) {
          router.refresh();
          return segundos;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router, segundos]);

  return (
    <button
      type="button"
      onClick={() => {
        router.refresh();
        setRestante(segundos);
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/25"
      title="Atualizar agora"
    >
      <RefreshCw size={13} className={restante <= 1 ? "animate-spin" : ""} />
      {aoVivo ? "Placar ao vivo" : "Atualiza sozinho"} · {restante}s
    </button>
  );
}
