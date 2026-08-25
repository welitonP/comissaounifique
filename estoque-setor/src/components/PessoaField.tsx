"use client";

import { useEffect, useState } from "react";

const CHAVE = "estoque-setor-quem";

/**
 * Campo "seu nome". Como o app não tem login, guardamos o nome no navegador de
 * cada um e preenchemos sozinho nas próximas vezes.
 */
export default function PessoaField({ className = "" }: { className?: string }) {
  const [nome, setNome] = useState("");

  useEffect(() => {
    try {
      setNome(localStorage.getItem(CHAVE) ?? "");
    } catch {
      // Navegador com armazenamento bloqueado: segue com o campo vazio.
    }
  }, []);

  return (
    <input
      name="quem"
      value={nome}
      onChange={(evento) => {
        setNome(evento.target.value);
        try {
          localStorage.setItem(CHAVE, evento.target.value);
        } catch {
          // Ignorado: o nome é uma conveniência, não pode quebrar o formulário.
        }
      }}
      placeholder="Seu nome"
      maxLength={60}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-unifique-blue focus:outline-none focus:ring-1 focus:ring-unifique-blue ${className}`}
    />
  );
}
