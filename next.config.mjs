/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  // Optimize images
  images: {
    domains: [],
  },
};

export default nextConfig;
