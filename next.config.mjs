/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // This option increases the timeout for serverless functions on Vercel.
  // The default is 10-15s, which may not be enough for document processing and AI generation.
  // We'll set it to 60 seconds.
  maxDuration: 60,
};

export default nextConfig;
