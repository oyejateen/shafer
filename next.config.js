/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `ws` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        bufferutil: require.resolve('bufferutil'),
        'utf-8-validate': require.resolve('utf-8-validate'),
      };
    }
    return config;
  },
  rewrites: async () => {
    return [
      {
        source: '/api/socket/:path*',
        destination: `http://localhost:${process.env.SOCKET_PORT || 3001}/api/socket/:path*`
      }
    ];
  },
  // Disable file tracing to prevent EPERM errors
  experimental: {
    outputFileTracingRoot: undefined
  }
};

module.exports = nextConfig;