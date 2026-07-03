/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Upload de fotos nos comunicados (limite da Vercel é ~4.5MB por request)
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede o site de ser embutido em iframes de terceiros (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Impede o navegador de "adivinhar" tipos de conteúdo
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Não vaza URLs internas para sites externos
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Bloqueia APIs sensíveis do navegador que o site não usa
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
