"use client";

import { useRef, useState } from "react";

// Redimensiona a imagem no próprio navegador antes de enviar.
// Fotos de celular costumam ter 3 a 8 MB e estouram o limite de upload do
// servidor (~4,5 MB por envio na Vercel), o que fazia a página quebrar.
// Aqui reduzimos para no máximo 1600px e convertemos para JPEG leve.
async function resizeImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const maior = Math.max(width, height);
    if (maior > maxDim) {
      const escala = maxDim / maior;
      width = Math.round(width * escala);
      height = Math.round(height * escala);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Fundo branco para PNGs com transparência não virarem preto no JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality),
    );
    if (!blob) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${nome}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // se algo falhar, envia o original (o servidor ainda valida)
  }
}

export default function PhotoField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const original = Array.from(e.target.files ?? []);
    if (original.length === 0) {
      setPreviews([]);
      return;
    }
    setBusy(true);
    const limitadas = original.slice(0, 4); // no máximo 4
    const otimizadas = await Promise.all(limitadas.map((f) => resizeImage(f)));

    // Substitui os arquivos do input pelos já redimensionados.
    const dt = new DataTransfer();
    otimizadas.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;

    setPreviews(otimizadas.map((f) => URL.createObjectURL(f)));
    setBusy(false);
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700">
        Fotos <span className="font-normal text-gray-400">(opcional · até 4)</span>
      </label>
      <input
        ref={inputRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="mt-1 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-unifique file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
      />
      {busy && <p className="mt-1 text-xs text-unifique-blue">Otimizando as fotos…</p>}
      {previews.length > 0 && !busy && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((src) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={src} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-400">
        As fotos são reduzidas automaticamente antes do envio. LGPD: publique apenas fotos de
        pessoas que autorizaram o uso de imagem.
      </p>
    </div>
  );
}
