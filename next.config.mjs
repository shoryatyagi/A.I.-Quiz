/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Proxy API requests to Flask backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://flask-backend-gabk.onrender.com"}/api/:path*`,
      },
    ];
  },

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
