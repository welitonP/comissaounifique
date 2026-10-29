"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Modalidades como botões de marcar (grandes para o dedo no celular), com
// contador. Antes de enviar, confere se pelo menos uma foi marcada; assim o
// formulário não volta vazio por causa disso.
export default function ModalidadesPicker({ modalidades }: { modalidades: { id: string; name: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const aoEnviar = (e: SubmitEvent) => {
      const algum = form.querySelector<HTMLInputElement>('input[name="modalidades"]:checked');
      if (!algum) {
        e.preventDefault();
        setAviso(true);
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    form.addEventListener("submit", aoEnviar);
    return () => form.removeEventListener("submit", aoEnviar);
  }, []);

  function alternar(id: string, on: boolean) {
    setMarcadas((prev) => {
      const n = new Set(prev);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
    if (on) setAviso(false);
  }

  if (modalidades.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma modalidade cadastrada ainda.</p>;
  }

  return (
    <div ref={ref}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {modalidades.map((m) => {
          const on = marcadas.has(m.id);
          return (
            <label key={m.id} className="cursor-pointer">
              <input
                type="checkbox"
                name="modalidades"
                value={m.id}
                className="peer sr-only"
                onChange={(e) => alternar(m.id, e.target.checked)}
              />
              <span
                className={`flex h-full items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition peer-focus-visible:ring-2 peer-focus-visible:ring-unifique/30 ${
                  on
                    ? "border-unifique bg-unifique text-white"
                    : "border-gray-200 text-gray-700 hover:border-unifique/40 dark:border-white/15 dark:text-gray-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
                    on ? "border-white bg-white text-unifique" : "border-gray-300"
                  }`}
                >
                  {on && <Check size={14} strokeWidth={3} />}
                </span>
                {m.name}
              </span>
            </label>
          );
        })}
      </div>
      <p className={`mt-2 text-sm ${aviso ? "font-semibold text-red-600" : "text-gray-500"}`}>
        {aviso
          ? "Marque pelo menos uma modalidade."
          : marcadas.size === 0
            ? "Marque uma ou mais."
            : `${marcadas.size} modalidade(s) selecionada(s).`}
      </p>
    </div>
  );
}
