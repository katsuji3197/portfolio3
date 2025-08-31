import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['images.microcms-assets.io'],
  },
  async redirects() {
    return [
      { source: '/works', destination: '/projects', permanent: true },
      { source: '/works/:id', destination: '/projects/:id', permanent: true },
    ];
  },
};

export default nextConfig;
