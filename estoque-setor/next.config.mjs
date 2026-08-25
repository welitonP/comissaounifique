import path from "node:path";
import { fileURLToPath } from "node:url";

const raizDoProjeto = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Este app vive numa subpasta do repositório. Sem fixar a raiz, o Next sobe até
  // o projeto pai (que também tem lockfile) e tenta compilar os arquivos de lá.
  turbopack: { root: raizDoProjeto },
  outputFileTracingRoot: raizDoProjeto,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
