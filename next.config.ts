import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['ably'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
}

export default nextConfig
