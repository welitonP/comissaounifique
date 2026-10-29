"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

// Compartilhar um link do site: copia a URL completa (domínio real) ou abre o
// WhatsApp com uma mensagem + o link. `path` é relativo (ex: /torneios/abc123).
export default function ShareLink({ path, message }: { path: string; message: string }) {
  const [copiado, setCopiado] = useState(false);

  function url() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${path}`;
  }

  async function copiar() {
    const texto = url();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
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
    const wa = `https://wa.me/?text=${encodeURIComponent(`${message}\n${url()}`)}`;
    window.open(wa, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center gap-1.5 rounded-lg border border-unifique px-3 py-1.5 text-sm font-semibold text-unifique transition hover:bg-unifique/10 dark:border-unifique-blue/60 dark:text-unifique-blue dark:hover:bg-unifique-blue/10"
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
        WhatsApp
      </button>
    </div>
  );
}
