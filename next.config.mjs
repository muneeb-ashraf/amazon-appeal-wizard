/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone - Amplify handles this automatically for Next.js 13+
  // output: 'standalone', // REMOVE THIS LINE
  
  // Ensure TypeScript paths are properly resolved
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Add experimental features for better compatibility
  experimental: {
    // Ensure server actions work properly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;