// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     unoptimized: true,
//   },
// }

// export default nextConfig


// const nextConfig = {
//   experimental: {
//     turbo: {
//       root: __dirname,
//     },
//   },
// }

// export default nextConfig

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig