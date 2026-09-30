import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las imágenes de /public ya están optimizadas (WebP). Servirlas directo
  // evita depender de la optimización de imágenes de Vercel, que tiene cupo
  // según el plan y devuelve 402 cuando se agota.
  images: { unoptimized: true },
};

export default nextConfig;
