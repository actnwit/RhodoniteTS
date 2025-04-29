import { defineConfig } from 'tsup'
import shaderity from 'esbuild-plugin-shaderity'
import version from 'esbuild-plugin-version'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist/esmdev',
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
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
