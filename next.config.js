/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['oaidalleapiprodscus.blob.core.windows.net'],
  },
  // Skip type checking and linting during build for faster deploys
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
