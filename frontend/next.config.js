/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'

const nextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig