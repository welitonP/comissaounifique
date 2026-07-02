"use client";

import { MessageCircle } from "lucide-react";

export default function ShareWhatsApp({ text, className }: { text: string; className?: string }) {
  function compartilhar() {
    const url =
      typeof window !== "undefined" ? `${text}\n\n${window.location.origin}` : text;
    const wa = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(wa, "_blank", "noopener");
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-105"
      }
    >
      <MessageCircle size={16} />
      Compartilhar
    </button>
  );
}
