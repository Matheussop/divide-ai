/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky filesystem cache packs pointing to deleted .next/vendor-chunks during HMR/hard reload.
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
