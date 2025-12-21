/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config, { isServer }) => {
    // Disable canvas for PDF parsing
    config.resolve.alias.canvas = false;

    // Handle pdfjs-dist properly
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: "canvas",
      });
    }

    return config;
  },
};

export default nextConfig;
