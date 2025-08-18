import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: '/works', destination: '/projects', permanent: true },
      { source: '/works/:id', destination: '/projects/:id', permanent: true },
    ];
  },
};

export default nextConfig;
