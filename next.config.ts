import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Image optimization – allow Supabase storage domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xqoweaneklogdryndgot.supabase.co',
      },
    ],
  },
}

export default nextConfig
