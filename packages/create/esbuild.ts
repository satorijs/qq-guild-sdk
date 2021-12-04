import { build, BuildOptions } from 'esbuild'

const options = {
  entryPoints: ['./src/index.ts'],
  minify: process.env.NODE_ENV === 'production',
  bundle: true,
  target: 'node10',
  platform: 'node',
  sourcemap: 'external',
  external: [ 'inquirer' ]
} as BuildOptions

build({
  ...options,
  format: 'cjs',
  outfile: './dist/index.js'
}).catch(error => {
  console.error(error.toString())
  process.exit(1)
})
