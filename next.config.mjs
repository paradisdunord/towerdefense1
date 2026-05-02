/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/towerdefense1',
  assetPrefix: '/towerdefense1/',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
