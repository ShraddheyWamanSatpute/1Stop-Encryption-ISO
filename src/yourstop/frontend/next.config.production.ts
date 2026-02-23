import type {NextConfig} from 'next';

// Production configuration for YourStop
// Can be used for static export or standalone deployment

const nextConfig: NextConfig = {
  // For static export (if deploying to CDN)
  // output: 'export',
  // basePath: '/yourstop',
  // assetPrefix: '/yourstop',
  
  // For standalone deployment (Docker, etc.)
  output: 'standalone',
  
  // Keep other config from next.config.ts
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  compress: true,
  
  // Image optimization
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;

