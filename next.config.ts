import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io',
      },
    ],
    qualities: [75, 80],
  },
  async redirects() {
    return [
      { source: '/works', destination: '/projects', permanent: true },
      { source: '/works/:id', destination: '/projects/:id', permanent: true },
    ];
  },
};

export default nextConfig;
