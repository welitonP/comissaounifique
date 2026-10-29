/** @type {import('next').NextConfig} */
const nextConfig = {
  // A logo passava pelo otimizador de imagem do Next (/_next/image), que tem
  // cota própria na Vercel. Quando a cota estoura, a imagem some (fica só o
  // círculo branco). Servindo direto da CDN: conserta a logo, mantém a
  // qualidade original e ainda tira esse gasto do Vercel.
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      // Upload de fotos nos comunicados (limite da Vercel é ~4.5MB por request)
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    const seguranca = [
      // Força o navegador a sempre usar HTTPS (nunca a versão insegura)
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Impede o navegador de "adivinhar" tipos de conteúdo
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Não vaza URLs internas para sites externos
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Bloqueia APIs sensíveis do navegador que o site não usa
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      {
        // Todo o site, menos o arquivo do regulamento.
        source: "/((?!api/torneio-regulamento/).*)",
        headers: [
          ...seguranca,
          // Impede o site de ser embutido em iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // O PDF do regulamento abre dentro da janela "Ver regulamento" da
        // própria página do torneio: aqui só o próprio site pode embutir.
        source: "/api/torneio-regulamento/:path*",
        headers: [...seguranca, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
