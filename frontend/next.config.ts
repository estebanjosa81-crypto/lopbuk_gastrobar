import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // necesario para el Dockerfile de producción
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://backend:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
