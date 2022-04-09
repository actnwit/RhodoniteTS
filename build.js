const esbuild = require('esbuild');
const shaderity = require('esbuild-plugin-shaderity');
const version = require('esbuild-plugin-version');
const {swcPlugin} = require('esbuild-plugin-swc');
esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outdir: 'dist',
  plugins: [shaderity(), version(), swcPlugin()],
});
