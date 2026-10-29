"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, FileText, X } from "lucide-react";

// Botão "Ver regulamento" + janela por cima da página (modal).
// Mostra o texto do regulamento e/ou o arquivo anexado (PDF ou imagem).
export default function RulesModal({
  title,
  text,
  fileUrl,
  fileMime,
  fileName,
  variant = "button",
}: {
  title: string;
  text: string | null;
  fileUrl: string | null;
  fileMime: string | null;
  fileName: string | null;
  variant?: "button" | "link";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Celular (Android/iPhone) não mostra PDF dentro da página: nesses casos
  // exibimos um cartão com botão "Abrir PDF" no lugar do leitor embutido.
  const [pdfEmbutido, setPdfEmbutido] = useState(false);

  useEffect(() => {
    setMounted(true);
    const nav = navigator as Navigator & { pdfViewerEnabled?: boolean };
    const telaGrande = window.matchMedia("(min-width: 768px)").matches;
    setPdfEmbutido(telaGrande && nav.pdfViewerEnabled !== false);
  }, []);

  // Fecha no Esc e trava a rolagem da página enquanto a janela está aberta.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isPdf = fileMime === "application/pdf";
  const isImage = !!fileMime?.startsWith("image/");

  const trigger =
    variant === "link" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-semibold text-unifique-blue underline-offset-2 hover:underline"
      >
        regulamento
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-unifique/20 bg-unifique-light/60 px-4 py-3 text-left transition hover:border-unifique/40 hover:bg-unifique-light dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-unifique text-white">
          <FileText size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display font-semibold text-unifique dark:text-white">
            Ver regulamento
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Leia as regras antes de se inscrever
          </span>
        </span>
        <span className="text-sm font-semibold text-unifique-blue transition group-hover:translate-x-0.5">
          Abrir →
        </span>
      </button>
    );

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={`Regulamento: ${title}`}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-unifique text-white">
            <FileText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Regulamento
            </p>
            <h2 className="truncate font-display text-lg font-bold text-unifique dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          {text && (
            <div className="px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {text}
              </p>
            </div>
          )}

          {fileUrl && isPdf && pdfEmbutido && (
            <div className={text ? "border-t border-gray-100 dark:border-white/10" : ""}>
              <iframe
                src={`${fileUrl}#view=FitH`}
                title={`Regulamento em PDF: ${title}`}
                className="h-[65vh] w-full bg-gray-100"
              />
            </div>
          )}

          {fileUrl && isPdf && !pdfEmbutido && (
            <div className={`p-5 ${text ? "border-t border-gray-100 dark:border-white/10" : ""}`}>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-unifique/40 hover:bg-unifique-light/40 dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex h-14 w-12 flex-none items-center justify-center rounded-lg bg-red-500 text-xs font-extrabold text-white shadow">
                  PDF
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-800 dark:text-gray-100">
                    {fileName || "Regulamento.pdf"}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Toque para abrir o regulamento completo
                  </span>
                </span>
                <span className="rounded-lg bg-unifique px-3 py-2 text-sm font-semibold text-white">Abrir PDF</span>
              </a>
            </div>
          )}

          {fileUrl && isImage && (
            <div className={`p-4 ${text ? "border-t border-gray-100 dark:border-white/10" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={`Regulamento: ${title}`} className="mx-auto w-full rounded-lg" />
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 dark:border-white/10 dark:bg-white/5">
          {fileUrl && (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200"
              >
                <ExternalLink size={15} /> Abrir em nova aba
              </a>
              <a
                href={`${fileUrl}?download=1`}
                download={fileName ?? undefined}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200"
              >
                <Download size={15} /> Baixar
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-unifique px-4 py-2 text-sm font-semibold text-white hover:bg-unifique-dark"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {trigger}
      {open && mounted && createPortal(modal, document.body)}
    </>
  );
}
