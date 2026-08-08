/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lunar-javascript', 'iztro'],
  // Vercel 优化
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

module.exports = nextConfig;