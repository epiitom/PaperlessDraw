/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to allow dynamic routes
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig