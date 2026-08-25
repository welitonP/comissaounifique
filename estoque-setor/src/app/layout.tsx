import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque do Setor",
  description: "Controle simples do que temos em estoque na bancada.",
};

export const viewport: Viewport = {
  themeColor: "#212492",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-unifique">
              📦 Estoque do Setor
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-unifique-light hover:text-unifique"
              >
                Estoque
              </Link>
              <Link
                href="/historico"
                className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-unifique-light hover:text-unifique"
              >
                Histórico
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-4xl px-4 pb-8 pt-2 text-center text-xs text-gray-400">
          Estoque compartilhado do setor · os dados ficam no banco, todo mundo vê o mesmo.
        </footer>
      </body>
    </html>
  );
}
