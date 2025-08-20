import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
  transpilePackages: ["@doorway/core"],
};

export default nextConfig;
