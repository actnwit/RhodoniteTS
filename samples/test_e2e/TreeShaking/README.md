# TreeShaking

The Simple scene written with named imports only, as an application that wants a small bundle uses Rhodonite.

`index.html` loads `bundle/main.js`, which `scripts/build-tree-shaking-sample.mjs` builds with esbuild
(tree shaking, code splitting, `__RN_WEBGPU__: false`). `pnpm build-samples` runs it after `tsc`.

The script also bundles four more entry points. The page never loads them; the test only reads their metafiles:

| Entry             | Bundle             | Scenario                                              |
| ----------------- | ------------------ | ----------------------------------------------------- |
| `mainGltf.ts`     | `bundle-gltf/`     | An application that only uses the glTF importer       |
| `mainPbr.ts`      | `bundle-pbr/`      | A PBR material factory imported from the package root |
| `mainOptional.ts` | `bundle-optional/` | The `rhodonite/optional-materials` subpath            |
| `mainWebGpu.ts`   | `bundle-webgpu/`   | A WebGPU-only application (`__RN_WEBGL__: false`)     |

The E2E test checks:

- the rendering (snapshot),
- that the bundle leaves out gizmos, the XR module, WGSL shaders, the `MaterialHelper` namespace, KTX2 and Rapier
  (from the esbuild metafile `bundle/meta.json`),
- that the glTF and PBR bundles keep the node-based and MToon material implementations out of the static closure,
  that the optional subpath provides them, and that the WebGPU bundle contains no GLSL,
- a static-size budget for each scenario (minimal, glTF, PBR, WebGPU),
- that the page never downloads the XR chunk, the PBR sheen LUT chunk or the light cluster system, and that
  `engine.isXREnabled` is false.

See `docs/design-notes/tree-shaking.md` for the background.
