/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@radix-ui/react-progress"],
  webpack: (config) => {
    config.externals = [...config.externals, "canvas", "jsdom"];
    return config;
  },
  rewrites: async () => {
    return [
      {
        source: '/api/socket/:path*',
        destination: process.env.NEXT_PUBLIC_SOCKET_URL + '/api/socket/:path*'
      }
    ];
  }
}

module.exports = nextConfig