"use client";

import { useEffect, useRef, useState } from "react";

// "Lembrar meus dados neste aparelho": preenche nome/WhatsApp (e o que mais for
// passado em `fields`) nos formulários de inscrição. Fica só no navegador da
// própria pessoa (localStorage), nada vai para o servidor além do envio normal.
const CHAVE = "comissao:meus-dados";

function ler(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "{}");
  } catch {
    return {};
  }
}

export default function RememberMe({ fields = ["name", "phone"] }: { fields?: string[] }) {
  const ref = useRef<HTMLLabelElement>(null);
  const [lembrar, setLembrar] = useState(true);
  const [preenchido, setPreenchido] = useState(false);
  const lembrarRef = useRef(lembrar);
  lembrarRef.current = lembrar;

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const salvos = ler();
    let algum = false;
    for (const f of fields) {
      const el = form.elements.namedItem(f);
      if ((el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && !el.value && salvos[f]) {
        el.value = salvos[f];
        el.dispatchEvent(new Event("input", { bubbles: true }));
        algum = true;
      }
    }
    setPreenchido(algum);

    const aoEnviar = () => {
      try {
        if (!lembrarRef.current) {
          localStorage.removeItem(CHAVE);
          return;
        }
        const dados = ler();
        for (const f of fields) {
          const el = form.elements.namedItem(f);
          if ((el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && el.value) dados[f] = el.value;
        }
        localStorage.setItem(CHAVE, JSON.stringify(dados));
      } catch {
        // navegação privada: só não lembra
      }
    };
    form.addEventListener("submit", aoEnviar);
    return () => form.removeEventListener("submit", aoEnviar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label ref={ref} className="flex items-center gap-2 text-xs text-gray-500">
      <input
        type="checkbox"
        checked={lembrar}
        onChange={(e) => setLembrar(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-unifique focus:ring-unifique"
      />
      Lembrar meus dados neste aparelho
      {preenchido && <span className="text-green-600">(preenchido automaticamente)</span>}
    </label>
  );
}
