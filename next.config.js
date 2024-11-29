/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    return [
      {
        source: '/api/socket/:path*',
        destination: process.env.NEXT_PUBLIC_SOCKET_URL + '/socket/:path*'
      }
    ];
  }
}

module.exports = nextConfig