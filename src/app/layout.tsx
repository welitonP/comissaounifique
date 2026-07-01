import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AssistantWidget from "@/components/AssistantWidget";
import { getCurrentUser } from "@/lib/auth";
import { isGeminiConfigured } from "@/lib/gemini";

export const metadata: Metadata = {
  title: "Comissão de Esportes Unifique",
  description: "Agenda, Entre Empresas, calendário, materiais e comunicados da comissão.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comissão Esportes",
  },
  icons: {
    icon: "/logo-comissao.jpg",
    apple: "/logo-comissao.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#212492",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        {user && <NavBar user={user} />}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        {user && <AssistantWidget configured={isGeminiConfigured()} />}
      </body>
    </html>
  );
}
