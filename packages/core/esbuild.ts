import { build, BuildOptions } from 'esbuild'

const options = {
  entryPoints: ['./src/index.ts'],
  minify: process.env.NODE_ENV === 'production',
  bundle: true,
  target: 'node10',
  sourcemap: 'external',
  external: [ 'axios', 'websocket' ]
} as BuildOptions

Promise.all([
  build({
    ...options,
    format: 'cjs',
    outfile: './dist/index.cjs'
  }),
  build({
    ...options,
    format: 'esm',
    outfile: './dist/index.mjs'
  })
]).catch(error => {
  console.error(error.toString())
  process.exit(1)
})
