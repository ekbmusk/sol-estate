import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // Solana SDK needs Buffer polyfill in browser
      buffer: "buffer",
    },
  },
};

export default nextConfig;
