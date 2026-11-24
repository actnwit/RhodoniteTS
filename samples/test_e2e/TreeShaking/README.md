# TreeShaking

The Simple scene written with named imports only, as an application that wants a small bundle uses Rhodonite.

`index.html` loads `bundle/main.js`, which `scripts/build-tree-shaking-sample.mjs` builds with esbuild
(tree shaking, code splitting, `__RN_WEBGPU__: false`). `pnpm build-samples` runs it after `tsc`.

The E2E test checks:

- the rendering (snapshot),
- that the bundle leaves out gizmos, the XR module, WGSL shaders, the `MaterialHelper` namespace, KTX2 and Rapier
  (from the esbuild metafile `bundle/meta.json`),
- that the page never downloads the XR chunk and `engine.isXREnabled` is false.
