
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firestuff-prod.imgix.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
  allowedDevOrigins: [
    'https://9004-idx-studio-1746506627755.cluster-c3a7z3wnwzapkx3rfr5kz62dac.cloudworkstations.dev',
  ], 
};

export default nextConfig;

