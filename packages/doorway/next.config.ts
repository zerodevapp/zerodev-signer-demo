import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/auth',
        destination: '/auth/register',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
