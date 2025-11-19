import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Railway için port yapılandırması (otomatik algılanır)
  // Output: 'standalone' production build için optimize eder
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
