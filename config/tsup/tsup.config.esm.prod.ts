import { defineConfig } from 'tsup'
import shaderity from 'esbuild-plugin-shaderity'
import version from 'esbuild-plugin-version'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist/esm',
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  // treeshake: true,
  dts: true,
  format: ['esm'],
  noExternal: ['ktx-parse', 'shaderity', 'zstddec'],
  esbuildPlugins: [
    shaderity({
      filter: /\.(wgsl|glsl|vs|fs|vert|frag)$/
    }),
    version({
      filter: /VERSION-FILE$/
    })
  ]
})
