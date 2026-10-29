"use client";

import { useFormStatus } from "react-dom";

// Botão de enviar que trava e mostra "Enviando..." enquanto o servidor responde
// (evita clique duplo em internet lenta).
export default function SubmitButton({
  children,
  pendingText = "Enviando...",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
