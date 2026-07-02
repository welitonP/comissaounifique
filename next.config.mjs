/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Upload de fotos nos comunicados (limite da Vercel é ~4.5MB por request)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
