"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { askAssistant } from "@/lib/ai-actions";

type Message = { role: "user" | "ai"; text: string };

const SUGESTOES = [
  "Quem está com a bolsa de uniforme?",
  "Quando é o próximo jogo?",
  "Quantas bolas de futsal temos?",
];

export default function AssistantWidget({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Balãozinho "Oi, posso ajudar?" some sozinho após 6s.
  useEffect(() => {
    const t = setTimeout(() => setShowGreeting(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function openChat() {
    setShowGreeting(false);
    setOpen((o) => !o);
  }

  function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("question", q);
      const res = await askAssistant(null, fd);
      setMessages((m) => [...m, { role: "ai", text: res.answer || res.error || "Sem resposta." }]);
    });
  }

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {/* Painel do chat */}
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between bg-unifique px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-comissao.jpg"
                alt="Pablinho"
                width={32}
                height={32}
                className="rounded-full bg-white"
              />
              <div>
                <p className="text-sm font-bold leading-tight">Pablinho</p>
                <p className="text-[11px] text-unifique-teal">Assistente da Comissão</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-unifique-light/40 p-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Olá! Sou o Pablinho, assistente virtual da comissão. Pergunte sobre materiais,
                  uniformes, jogos e atletas.
                </p>
                {!configured && (
                  <p className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                    A IA ainda não foi ativada (falta a chave GEMINI_API_KEY).
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-unifique-blue/40 bg-white px-3 py-1 text-left text-xs text-unifique hover:bg-unifique-blue/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-unifique text-white"
                      : "bg-white text-gray-800 ring-1 ring-black/5"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}

            {pending && (
              <div className="text-left">
                <span className="inline-block rounded-2xl bg-white px-3 py-2 text-sm text-gray-400 ring-1 ring-black/5">
                  digitando…
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-gray-100 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-unifique focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-unifique text-white hover:bg-unifique-dark disabled:opacity-60"
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante (logo da comissão) + balãozinho */}
      <div className="flex items-end gap-2">
        <button
          onClick={openChat}
          aria-label="Abrir Pablinho"
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105"
        >
          {!open && (
            <span className="absolute inset-0 animate-ping rounded-full bg-unifique-blue opacity-60" />
          )}
          {open ? (
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-unifique text-2xl text-white">
              ✕
            </span>
          ) : (
            <Image
              src="/logo-comissao.jpg"
              alt="Pablinho"
              width={56}
              height={56}
              className="relative h-14 w-14 rounded-full object-cover ring-2 ring-white"
              priority
            />
          )}
        </button>

        {showGreeting && !open && (
          <button
            onClick={openChat}
            className="mb-2 animate-bounce rounded-2xl rounded-bl-none bg-white px-3 py-2 text-sm font-medium text-unifique shadow-lg ring-1 ring-black/5"
          >
            Olá! Posso ajudar?
          </button>
        )}
      </div>
    </div>
  );
}
