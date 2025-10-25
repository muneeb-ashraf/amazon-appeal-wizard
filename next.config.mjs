/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure TypeScript paths are properly resolved
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;