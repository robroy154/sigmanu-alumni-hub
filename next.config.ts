import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {
    // Silence workspace root inference warning caused by a lockfile in the home directory
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage — update project ref after Phase 2 Supabase setup
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
