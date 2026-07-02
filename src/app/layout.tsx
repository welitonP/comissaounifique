import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AssistantWidget from "@/components/AssistantWidget";
import { getCurrentUser } from "@/lib/auth";
import { isGeminiConfigured } from "@/lib/gemini";

export const metadata: Metadata = {
  title: "Comissão de Esportes Unifique",
  description:
    "Calendário de jogos, comunicados, Entre Empresas e tudo do esporte na Unifique.",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <NavBar user={user} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
        {user && <AssistantWidget configured={isGeminiConfigured()} />}
      </body>
    </html>
  );
}
