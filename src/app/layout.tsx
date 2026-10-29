import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import AssistantWidget from "@/components/AssistantWidget";
import ScrollProgress from "@/components/anim/ScrollProgress";
import { getCurrentUser } from "@/lib/auth";
import { isAIConfigured } from "@/lib/ai";
import { isInscricoesAbertas } from "@/lib/settings";
import { Analytics } from "@vercel/analytics/next";

// URL pública do site (usada para montar links absolutos no preview de
// compartilhamento). Pode ser sobrescrita por NEXT_PUBLIC_SITE_URL na Vercel.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.unifiqueesportes.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Comissão de Esportes Unifique",
    template: "%s · Comissão de Esportes Unifique",
  },
  description:
    "Calendário de jogos, comunicados, Entre Empresas e tudo do esporte na Unifique.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comissão Esportes",
  },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // Preview padrão ao compartilhar (WhatsApp, redes). Páginas específicas
  // (ex: torneio) sobrescrevem com a própria imagem/cartaz.
  openGraph: {
    type: "website",
    siteName: "Comissão de Esportes Unifique",
    locale: "pt_BR",
    title: "Comissão de Esportes Unifique",
    description:
      "Calendário de jogos, comunicados, Entre Empresas e tudo do esporte na Unifique.",
    images: [{ url: "/logo-comissao.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Comissão de Esportes Unifique",
    description:
      "Calendário de jogos, comunicados, Entre Empresas e tudo do esporte na Unifique.",
    images: ["/logo-comissao.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#212492",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, inscricoesAbertas] = await Promise.all([getCurrentUser(), isInscricoesAbertas()]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema escuro antes da primeira pintura, evitando "piscada".
            Padrão: claro. Só fica escuro se a pessoa tiver escolhido. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('tema')==='escuro'){document.documentElement.classList.add('dark')}}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ScrollProgress />
        <NavBar user={user} inscricoesAbertas={inscricoesAbertas} />
        <main className="fade-in-up mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
        {user && <AssistantWidget configured={isAIConfigured()} />}
        {/* Contagem de acessos (Vercel Analytics, sem cookies) */}
        <Analytics />
      </body>
    </html>
  );
}
