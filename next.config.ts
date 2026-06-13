import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/cdn/:path*",
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/:path*`,
      },
    ];
  },
  experimental: {
    // Increase server action body size limit for base64 image uploads (default 1MB)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serverActions: { bodySizeLimit: "8mb" } as any,
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
