/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Headers required for SharedArrayBuffer (WASM threading)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  // Exclude Linera SDK from server-side bundling
  experimental: {
    serverComponentsExternalPackages: ['@linera/client'],
  },
  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Empty config to acknowledge we're using Turbopack
    // WASM files are handled automatically by Turbopack
  },
  webpack: (config, { isServer }) => {
    // This only runs in production builds with webpack
    // Enable WebAssembly and top-level await for Provable SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Handle .wasm files as static assets (don't process them)
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });

    // Exclude large WASM files from being parsed by webpack
    config.module.noParse = /\.wasm$/;

    return config;
  },
}

export default nextConfig
