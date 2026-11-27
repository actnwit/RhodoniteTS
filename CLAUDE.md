# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RhodoniteTS is a comprehensive Web3D graphics library written in TypeScript that supports both WebGL2 and WebGPU rendering APIs. It features a "Blittable Memory Architecture" for efficient GPU data transfer and supports advanced rendering techniques including PBR, IBL, WebXR, and various 3D model formats.

## Essential Commands

### Building
```bash
pnpm build                 # Build all targets (ESM + IIFE, dev + prod)
pnpm build-esm-dev         # Development ESM build with source maps
pnpm build-esm-prod        # Production ESM build (optimized)
pnpm build-samples         # Compile TypeScript samples
```

### Development Workflow
```bash
pnpm watch-esm-dev         # Watch mode for library development
pnpm watch-samples         # Watch samples with auto-reload and dev server
pnpm start                 # Start development server on port 8082
```

### Testing
```bash
pnpm test                  # Run all tests (unit + E2E visual regression)
pnpm test-unit             # Unit tests only (Vitest)
pnpm test-e2e              # E2E visual tests only (Puppeteer)
pnpm test-coverage         # Test with coverage report
pnpm test-e2e-update       # Rewrite the E2E snapshots that currently fail (in the current environment)
pnpm test-e2e:docker       # Strict E2E run in the CI container (reference environment)
pnpm test-e2e:docker:update # Regenerate all E2E reference images in the CI container
```

### Code Quality
```bash
pnpm lint                  # Lint code using Biome
pnpm lint-fix              # Auto-fix linting issues
pnpm format                # Check formatting using Biome
pnpm format-fix            # Auto-format code
pnpm check                 # Run both linting and formatting checks
pnpm check-fix             # Auto-fix both linting and formatting issues
pnpm doc                   # Generate TypeDoc API documentation
```

### Important Notes
- **Node.js 22+** is strictly required
- E2E tests are GPU-dependent; CI runs them on `ubuntu-24.04-arm` with Mesa's
  llvmpipe + lavapipe and Chromium's WebGPU-on-Vulkan-via-GL-interop path, so
  WebGL2 and WebGPU screenshots are both compared there
- Always run `pnpm build && pnpm build-samples && pnpm test` before submitting PRs
- The default branch is `main`; pull requests target `main`. PR titles must follow Conventional Commits
  (`feat: ...`, `fix(scope): ...`), which the `Lint PR` workflow checks
- Some unit tests import `dist/esm` instead of `src` (e.g. `Entity.test.ts`, `LightClusterSystem.test.ts`),
  so rebuild `dist` before running unit tests after a source change
- Design notes (why features are built the way they are, measured trade-offs, rejected alternatives) are in
  `docs/design-notes/`. Read the relevant note before changing Clustered Forward, shadows, multi-draw,
  GPU culling, the depth prepass, TAA, the scene graph update or the tree-shaking setup

## Core Architecture

### Component-Oriented Design
- **Entity-Component-System (ECS)**: Scene graph management through entities with attachable components
- **Component Types**: Transform, Mesh, Camera, Light, Animation, Physics, Skeletal, BlendShape, VRM, Effekseer
- **Component Repository**: Centralized component management and lifecycle

### Memory Management Strategy
- **Blittable Memory Architecture**: Data stored in pre-allocated ArrayBuffers for efficient GPU transfer
- **Memory Pools**: Components use typed array views into shared memory pools
- **GPU Optimization**: Data layout optimized for transfer as floating-point textures

### Multi-API Rendering
- **Strategy Pattern**: Abstract rendering interfaces supporting both WebGL2 and WebGPU
- **Resource Repositories**: Separate management for WebGL and WebGPU resources
- **Unified Shader System**: Cross-platform shader compilation and management

### Material System
- **Node-Based Composition**: Shader nodes for flexible material creation
- **Material Contents**: Abstraction layer for different material types (PBR, MToon, MatCap, etc.)
- **Shader Graph Resolver**: Automatic dependency resolution for shader node graphs

## Key Source Directories

```
src/foundation/
├── components/           # ECS components (Transform, Mesh, Camera, Light, etc.)
├── core/                # Core systems (Entity, Component, Repository, Memory)
├── system/              # Engine (entry point, frame processing), ModuleManager, InputManager
├── renderer/            # RenderPass, Expression, FrameBuffer, pipelines/ (ForwardRenderPipeline),
│                        #   lightCluster/ (Clustered Forward), TemporalAA/
├── materials/           # Material system (Material, MaterialContent, shader nodes)
├── math/               # Mathematical primitives (Vector, Matrix, Quaternion, Color)
├── geometry/           # Mesh and primitive geometry (Primitive, Buffer, Accessor)
├── physics/            # Physics integration (PhysicsComponent, collision detection)
├── helpers/            # Utility helpers (data conversion, validation, etc.)
└── importer/           # Asset importers (glTF, VRM, DRC, KTX2, etc.)

src/webgl/              # WebGL-specific implementation
src/webgpu/             # WebGPU-specific implementation
src/types/              # TypeScript type definitions
src/effekseer/          # Effekseer particle system integration
src/xr/                 # WebXR support
```

## Build System

### Build Targets
- **ESM Dev** (`dist/esmdev/`): Development build with inline source maps, one file per source module
- **ESM Prod** (`dist/esm/`): Minified production build, one file per source module
- The ESM builds are unbundled (`config/esbuild/unbundled.mjs`) so that applications can tree-shake them;
  `package.json` lists only the shared `dist/*/_deps/chunk-*.js` files in `"sideEffects"`, so every other module
  is side-effect free. Imports that leave `src/` (npm packages, `vendor/*.js`) are bundled once into
  `dist/<target>/_deps/`, so the output also runs in browsers without an import map.
- **Property mangling**: `__`-prefixed properties are mangled in every build (`mangleProps` in
  `config/esbuild/build.mjs`, with one shared `mangleCache` across the unbundled entry points). Names read across
  package boundaries (e.g. `__importedType`, read by RhodoniteEditor2) must be added to `reserveProps`.
- **Tree-shaking rules**: no module may do work at import time that another module relies on (e.g. registering
  classes into a shared registry). Component classes are registered lazily by
  `EntityRepository.addComponentToEntity`; the core ones by `Engine.init`. Avoid value-import cycles: a cycle
  containing `class X extends Y` fails with a TDZ error depending on which module an application imports first.
- **Keep hubs out of the core path**: import material factories from `foundation/helpers/materials/<name>`, not the
  `MaterialHelper` object (it references every material). Reach physics through `physics/PhysicsBackend`
  (registered by `RapierPhysicsStrategy.initialize`), not `RapierPhysicsStrategy` directly.
- **Shaders by backend**: the common GLSL/WGSL chunks come from the backend modules (`webgl/shaders/glslCommonChunks.ts`,
  `webgpu/wgslCommonChunks.ts`, read by `ShaderHandler` through `ModuleManager`). Every other shader import under
  `src/foundation` is gated as `const X = typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? X_ : undefined;`
  (`__RN_WEBGL__` for GLSL, see `src/backendFlags.d.ts`) so applications can drop a backend with a bundler `define`.
  Never read a gated shader at module top level.
- **Optional features stay out of the core path**: create gizmos only through `_getGizmoClass(kind)`
  (`gizmos/GizmoRegistry.ts`; classes are registered by `registerGizmos()`). Internal code reads XR state through
  `engine._webXRSystemIfEnabled` / `_webARSystemIfEnabled` (undefined unless XR is enabled), never the public
  `webXRSystem` getter, which throws when XR is off. The default `Rn` export enables both via
  `enableRnNamespaceDefaults` (bound to the default export value so webpack cannot skip it); the build rewrites
  `dist/*/index.d.ts` so that `Rn` stays usable as a type namespace.
- **IIFE Dev** (`dist/iifedev/rhodonite.js`): Browser-ready development bundle
- **IIFE Prod** (`dist/iife/rhodonite.min.js`): Minified production bundle

### Build Tools
- **esbuild**: Primary build tool (`config/esbuild/build.mjs`)
- **esbuild-plugin-shaderity**: Processes shader files during build
- **esbuild-plugin-version**: Handles version file generation
- **TypeScript**: Type checking and .d.ts generation

## Testing Infrastructure

### Unit Tests (Vitest)
- **Environment**: Happy DOM for lightweight browser simulation
- **Coverage**: Available via V8 coverage provider
- **Location**: Test files alongside source code (`*.test.ts`)

### E2E Tests (Puppeteer)
- **Purpose**: Visual regression testing for rendering accuracy
- **Location**: `samples/test_e2e/`
- **Environment Sensitive**: Reference images are generated by the CI container
  (Linux + Mesa llvmpipe/lavapipe); native runs (macOS, real GPU) apply a 2%
  tolerance floor (`E2E_NON_REFERENCE_FAILURE_THRESHOLD`)
- **CI**: Runs on `ubuntu-24.04-arm` with Mesa llvmpipe + lavapipe; Chromium's
  WebGPU-on-Vulkan-via-GL-interop path makes WebGPU canvases capturable, so
  WebGL2 and WebGPU snapshots are both compared (`E2E_WEBGPU_SMOKE=1` disables
  WebGPU comparison where interop is unavailable). CI and the Docker container
  compare strictly (`E2E_REFERENCE_FAILURE_THRESHOLD` defaults to 0).
- **Same environment locally**: `pnpm test-e2e:docker` (strict run) and
  `pnpm test-e2e:docker:update` (regenerate reference images) use the CI
  container, so local and CI compare against the same rendering
- **Filtered reference updates**: to regenerate only one sample, run
  `npx vitest run --config ./config/test/vitest.config.e2e.ts ./samples/test_e2e/<Sample> --update=all`
  (in the container shell: `bash config/e2e/run-in-docker.sh shell`). `--update` takes an
  optional value, so `--update ./samples/<Sample>` swallows the path and updates the whole suite.
- **Snapshots**: Image comparison with automatic snapshot updating
- **TreeShaking sample**: `samples/test_e2e/TreeShaking` is the only sample that is bundled. `pnpm build-samples`
  runs `scripts/build-tree-shaking-sample.mjs` (esbuild, named imports, `__RN_WEBGPU__: false`) after `tsc`, and the
  test checks the bundle's metafile (no gizmos, XR, WGSL, MaterialHelper, KTX2, Rapier) as well as the rendering.
  The other scenarios (`mainGltf.ts`, `mainPbr.ts`, `mainOptional.ts`, `mainWebGpu.ts` with `__RN_WEBGL__: false`)
  are bundled for their metafiles only, and each one has a static-size budget.
  If it fails after a change, something in the core path started importing an optional feature again
  (see `docs/design-notes/tree-shaking.md`).

## Development Patterns

### Component Development
- Components extend base `Component` class and implement required interfaces
- Component classes are registered with `ComponentRepository` lazily, when they are first added to an entity
  (`EntityRepository.addComponentToEntity`); never register them at module top level
- Behavior that `Engine` must call for an optional component goes through `registerComponentRuntimeHooks`
  (`core/ComponentRuntimeHooks.ts`) instead of an import from `Engine`
- Follow established patterns in existing components for consistency

### Memory Allocation
- Use `MemoryManager` for efficient memory pool allocation
- Components should use typed array views rather than creating new arrays
- Consider GPU data layout when designing data structures

### Material Creation
- Extend `AbstractMaterialContent` for new material types
- Use shader nodes for composable material features
- Register materials with `MaterialRepository`
- Node-based materials (`createNodeBasedCustomMaterial`, the raymarching factories) and MToon
  (`createMToon0xMaterial`, `createMToon1Material`) live in
  `foundation/helpers/materials/optionalMaterials.ts` and are exported from the
  `rhodonite/optional-materials` subpath, not the package root. They pull in the shader graph
  resolver / every shader node / the MToon contents, so keep them out of the root barrel:
  re-exporting them there makes bundlers keep that subtree for every app that imports another
  material factory. The `MaterialHelper` object still includes them for compatibility.

### Asset Loading
- `GltfImporter.importFromUrl` / `importFromArrayBuffers` detect glTF, GLB, VRM and Draco by extension and
  content, and return an `Expression`
- Optional importer support (node-based and MToon materials, raymarching, `KHR_physics`, Draco point clouds,
  the sheen LUT) is dynamically imported and preloaded from the async `ModelConverter.convertToRhodoniteObject`;
  keep new optional features on that pattern
- `AssetLoader` (`helpers/AssetLoader.ts`) is a typed promise queue (concurrency limit, timeout, retry factories),
  not a format loader

### Rendering Integration
- Use `RenderPass` system for organizing rendering operations
- Support both WebGL and WebGPU rendering strategies
- Follow established patterns for resource management

### Shader Sources (GLSL / WGSL)
- **Never use backticks in `src/webgl/shaderity_shaders/**` or `src/webgpu/shaderity_shaders/**`, not even in comments.**
  At runtime Shaderity's `ShaderEditor._fillTemplate` evaluates the whole shader source as a template literal
  (``new Function("return `" + code + "`;")``). A backtick closes that template, and the following shader text is
  parsed as JavaScript:
  `SyntaxError: Unexpected identifier '...'` at `new Function` / `ShaderEditor._fillTemplate`.
- `${...}` is intentional template substitution (e.g. `u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}]`
  in `viewingTransform.glsl`, and the `/* shaderity: @{...} */` markers). Do not write a literal `${` unless it is
  meant to be substituted.
- The failure happens when a shader program is created, not at build time, so a build passing does not prove the
  shaders are valid. Run the E2E samples (or reproduce the evaluation) after editing shader sources:
  ```bash
  node -e 'const fs=require("fs"); for (const f of process.argv.slice(1)) {
    new Function("return `" + fs.readFileSync(f, "utf8") + "`;"); console.log("OK", f); }' \
    src/webgl/shaderity_shaders/common/opticalDefinition.glsl
  ```
- Shader changes are embedded in `dist/` by `esbuild-plugin-shaderity`, so rebuild the bundle
  (`pnpm build` / `pnpm watch-esm-dev`) before re-running the samples or the editor.

## Dependencies

### Runtime Dependencies
- **ktx-parse**: KTX2 texture format parsing
- **shaderity**: Shader compilation and cross-platform support
- **zstddec**: ZSTD decompression for compressed assets

### Key Dev Dependencies
- **@biomejs/biome**: Fast linter and formatter for consistent code quality
- **typedoc**: API documentation generation
- **vitest**: Fast unit testing framework
- **puppeteer**: Automated browser testing for E2E

## Other Notes

- Think in English deeply, and respond to user in Japanese.
