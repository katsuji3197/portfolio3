import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      { source: '/works', destination: '/projects', permanent: true },
      { source: '/works/:id', destination: '/projects/:id', permanent: true },
    ];
  },
};

export default nextConfig;
