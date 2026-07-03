"use client";

// Botão de submit que pede confirmação antes de enviar o formulário.
// Usado em ações destrutivas (ex: limpar inscrições / elenco).
export default function ConfirmButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
