# Tree shaking

Code: `config/esbuild/build.mjs`, `config/esbuild/unbundled.mjs`, `package.json` (`exports`, `sideEffects`),
`src/backendFlags.d.ts`, `src/foundation/system/ModuleManager.ts`, `src/foundation/gizmos/GizmoRegistry.ts`,
`src/foundation/core/ComponentRuntimeHooks.ts`, `src/foundation/helpers/materials/optionalMaterials.ts`.
Test: `samples/test_e2e/TreeShaking` (the only bundled sample; see CLAUDE.md).

The rules that keep the build tree-shakeable are in [CLAUDE.md](../../CLAUDE.md) under "Build System". This note
covers how the build got there and what is left.

## Starting point (2026-11-24)

- `dist/esm/index.js` was one 2.5 MB pre-bundled file that exported only `default` (the `Rn` namespace), with ~756
  lazy `__esm` wrappers. Consumers could not tree-shake it at all: `import { Vector3 }` and an Engine + cube app
  both loaded ~2.2 MB.
- Simulating `"sideEffects": false` showed `Vector3` alone at ~29 KB, but a minimal scene still at ~1.67 MB:
  - 337 KB of GLSL and 267 KB of WGSL, because `MaterialHelper` imported every shader of both backends
  - 73 KB of zstddec (KTX2)
  - 50 KB of gizmos (imported by Engine)
  - 19 KB of Rapier
- A naive `sideEffects: false` drops `registerComponents.ts`, whose module-scope `registerComponentClass` calls then
  never run. The components were unregistered at runtime.
- With splitting enabled, esbuild reported "generated chunks contain a circular import": the source had module
  cycles.

## What was done

1. **Unbundled ESM.** One output file per source module (`unbundled.mjs`). Imports that leave `src/` (npm
   packages, `vendor/*.js`) are bundled once into `dist/<target>/_deps/`, so the output also runs without an
   import map. `package.json` lists only the shared `_deps/chunk-*.js` files as side-effectful; every other module
   is side-effect free.
2. **No work at import time.** A component class is registered when it is first added to an entity
   (`EntityRepository.addComponentToEntity`); the core ones are registered in `Engine.init`. Animation and camera
   controller behavior that Engine used to call directly goes through `registerComponentRuntimeHooks`, so Engine
   no longer imports those components. The `createXxxEntity` helpers use component TIDs on purpose: importing the
   component classes there created a 28-module cycle and a TDZ error on `IShape extends Primitive`.
3. **Splitting the hubs.** `MaterialHelper` was split into `helpers/materials/*`. Mesh creation functions are named
   exports (`MeshHelperObject.ts` keeps the object). Physics is reached through `physics/PhysicsBackend`, which
   `RapierPhysicsStrategy.initialize` registers.
4. **Backend-gated shaders.** The common GLSL and WGSL chunks moved into the backend modules. Every other shader
   import is gated by `__RN_WEBGL__` / `__RN_WEBGPU__`, and `ModuleManager` gates the backend dynamic imports too,
   so the unused backend's chunk is not emitted.
5. **Optional features loaded on demand:**
   - Gizmos come from `GizmoRegistry` and are registered by `registerGizmos()`.
   - XR comes from `Engine.init({ xr })` or `engine.enableXR()`. Internal code reads `engine._webXRSystemIfEnabled`.
   - KTX2 is a dynamic import.
   - The PBR sheen LUT loads on the first sheen material (`DummyTextures.requestSheenLutTexture`).
   - Draco point clouds, the Rapier strategy for `KHR_physics`, the node-based and MToon factories, and the
     raymarching component are dynamically imported. Their preloads run from the async
     `ModelConverter.convertToRhodoniteObject` (`preloadRaymarchingSupport`, `preloadKhrPhysicsSupport`, ...).
   - `WebXRInput` imports the glTF importer only for controller models.
   - The light cluster system is lazy too (see [clustered-forward.md](./clustered-forward.md#lazy-loading)).
6. **`rhodonite/optional-materials` subpath.** Importing any factory from the root used to pull in the materials
   barrel. Its unused re-exports of the node-based and MToon factories were placed in a shared chunk together with
   statically used modules, because the lazy importer and XR chains use them, so the chunk loaded statically.
   `sideEffects` does not prevent this; both the boolean and the array forms were verified. Those factories now
   live in `optionalMaterials.ts` and are exported only from the subpath. A PBR app went from 957 K/205 K gzip to
   686 K/155 K gzip.
7. **The default `Rn` export** is `/*#__PURE__*/ enableRnNamespaceDefaults(RnNamespace)`. A top-level statement in
   `index.ts` does not work, because webpack resolves `Rn.X` to the re-exported module and skips the statements of
   `index.js`. The build rewrites `dist/*/index.d.ts` so that `Rn` stays usable as a type namespace (`Rn.Type`).

### Property mangling

`build.mjs` mangles `__`-prefixed properties (`mangleProps: /^__/`). Some names are reserved (`reserveProps`):
`__esModule`, `__proto__`, `__importedType` (read by RhodoniteEditor2), `__animationTrack`,
`__createAndUpdateDataTextureInner` and `__dataTextureUid`.

- The unbundled build shares one `mangleCache` across all entry points. Without it, esbuild names each entry point
  separately and cross-module accesses break.
- The `_deps` build must not mangle.
- esbuild uses Go's RE2, so a negative lookahead is invalid in `mangleProps`. That is why the exclusions go in
  `reserveProps`.

**Consequence:** private fields have short names in `dist/`. A build that adds new private names rewrites hundreds
of `dist` files.

### Hidden dependency found

The generated shaders always need the bone data members of `SkeletalComponent`. They used to be registered only
because the XR module imported `ModelConverter`, which imported `SkeletalComponent`. `Engine.init` now registers
`SkeletalComponent` explicitly.

Pixel checks must run one engine per fresh page: engines in one page share module state, which hides this kind of
bug.

## Rejected or skipped

- **Stripping shader comments.** `//` comments in the shaders are parsed metadata (`initialValue` etc.), and
  `/* */` comments are Shaderity markers. Removing whitespace only gains little.

## Current numbers

The `TreeShaking` E2E test enforces regression budgets on the static closure of each scenario:

| Scenario | Size at the time of writing | Budget |
|---|---|---|
| Minimal (`main.ts`) | ~517 KB | 550 KB |
| glTF importer (`mainGltf.ts`) | ~714 KB | 745 KB |
| PBR via root factory (`mainPbr.ts`) | ~552 KB | 590 KB |
| WebGPU only (`mainWebGpu.ts`, `__RN_WEBGL__ = false`) | — | 600 KB |

The test also checks that the light cluster system, the PBR sheen LUT chunk and the XR chunk are not requested at
runtime by the minimal page, and that the WebGPU bundle contains no GLSL.

## Remaining blockers

- **`SkeletalComponent` stays in the core path.** Its member info is class-keyed and feeds the shader layout and the
  memory allocation. Separating it needs a refactor keyed on TID or data class.
- **The Shaderity runtime** (~31 KB).
- **math/core.**

## Gotchas when measuring

- **Do not `git stash` to measure a baseline.** `dist/` is tracked, so a rebuild dirties it and `stash pop` then
  conflicts. Build the baseline in a separate `git worktree`.
- **Some unit tests import `dist/esm`, not `src`** (for example `Entity.test.ts`, `LightClusterSystem.test.ts`).
  Rebuild `dist` before running unit tests after a source change.
- **The repository's `package.json` self-references the name `rhodonite`**, and a package self-reference wins over
  `node_modules`. A consumer test project inside the repository needs its own `package.json` with a different
  name. The sample build script creates a temporary `node_modules/rhodonite` that points at `dist/esmdev` and
  removes it afterwards.
- **Selecting the entry chunk in an esbuild metafile.** Match `entryPoint.endsWith('.../main.ts')`; dynamic chunks
  have `entryPoint` set too.
- **WebGPU bind groups cache their textures.** A GPU texture created lazily after a bind group cached its
  placeholder keeps the placeholder. So the glTF importer detects `KHR_materials_sheen` and awaits
  `DummyTextures.loadSheenLutTexture()` before creating materials. WebGL2 does not have this problem, because it
  binds per draw.
