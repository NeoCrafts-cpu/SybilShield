/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables available on client
  env: {
    NEXT_PUBLIC_RELAYER_URL: process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:5000',
    NEXT_PUBLIC_ALEO_NETWORK: process.env.NEXT_PUBLIC_ALEO_NETWORK || 'testnet',
  },

  // Image optimization
  images: {
    domains: ['localhost', 'app.proofofhumanity.id'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle Aleo SDK WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Ignore certain modules on client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Wallet-Address, X-Signature' },
        ],
      },
    ];
  },

  // Rewrites to proxy API calls to relayer
  async rewrites() {
    const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/relayer/:path*',
        destination: `${relayerUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
