"use client";

/** Botão de submit que pede confirmação antes de enviar o formulário. */
export default function BotaoConfirmar({
  pergunta,
  children,
  className = "",
}: {
  pergunta: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(evento) => {
        if (!confirm(pergunta)) evento.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
