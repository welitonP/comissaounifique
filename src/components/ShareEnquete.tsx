"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

export default function ShareEnquete({
  question,
  pollId,
}: {
  question: string;
  pollId?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  // Monta o link público da enquete (usa o domínio real do site).
  function linkEnquete() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/enquetes${pollId ? `#enquete-${pollId}` : ""}`;
  }

  function mensagem() {
    return `🗳️ Vote na enquete da Comissão de Esportes Unifique: ${question}\n${linkEnquete()}`;
  }

  async function copiar() {
    const texto = linkEnquete();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // fallback para navegadores antigos
      const el = document.createElement("textarea");
      el.value = texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function whatsapp() {
    const wa = `https://wa.me/?text=${encodeURIComponent(mensagem())}`;
    window.open(wa, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-sm font-semibold text-unifique transition hover:bg-unifique/10"
      >
        {copiado ? <Check size={16} /> : <Copy size={16} />}
        {copiado ? "Link copiado!" : "Copiar link"}
      </button>
      <button
        type="button"
        onClick={whatsapp}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-105"
      >
        <MessageCircle size={16} />
        Enviar no WhatsApp
      </button>
    </div>
  );
}
