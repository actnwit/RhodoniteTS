# RhodoniteTS Developer Workflow

Day-to-day development of the library. The coding rules (tree shaking, shader sources, tests) are in
[CLAUDE.md](../CLAUDE.md); the reasoning behind the rendering features is in [design-notes/](./design-notes/README.md).

## Setup

- Node.js 22 or later (CI uses Node 24).
- pnpm, at the version pinned by `packageManager` in `package.json`.

```bash
git clone https://github.com/actnwit/RhodoniteTS.git
cd RhodoniteTS
git submodule update --init
pnpm install
pnpm build          # ESM (dev + prod) and IIFE (dev + prod) builds
pnpm build-samples  # compile the samples (needed by the E2E tests)
pnpm test-unit
```

## Development loop

```bash
pnpm watch-esm-dev    # rebuild dist/esmdev on change
pnpm watch-samples    # recompile the samples on change and serve them
pnpm start            # serve the repository at http://localhost:8082
```

The samples import `dist/esmdev/index.js`, so a library change becomes visible after `watch-esm-dev` (or
`pnpm build-esm-dev`) has rebuilt it. Shader sources are embedded into `dist/` at build time, so they need a rebuild
too.

## Branches and pull requests

- `main` is the default branch. Create a feature branch from it and open the pull request against `main`.
- The pull request title must follow Conventional Commits (`feat: ...`, `fix(scope): ...`, `perf: ...`, `docs: ...`);
  the `Lint PR` workflow checks it.
- `dist/` is tracked. Keep distribution file updates out of feature commits unless the change needs them, and
  never use `git stash` around a rebuild (the rebuilt `dist/` conflicts on `stash pop`); use a `git worktree` to
  build a baseline instead.

## Code quality

```bash
pnpm check        # Biome lint + format check (what CI runs, with `pnpm lint` and `pnpm format`)
pnpm check-fix    # apply safe fixes
pnpm lint-fix     # lint fixes only
pnpm format-fix   # formatting only
```

## Testing

### Unit tests

```bash
pnpm test-unit
pnpm test-unit-part -- ./src/foundation/core
pnpm test-unit-part -- ./src/foundation/core/Entity.test.ts
pnpm test-coverage
```

Tests are colocated as `*.test.ts` and run in happy-dom with `ProcessApproach.None` where an engine is needed. Some
tests import `dist/esm` instead of `src`, so run `pnpm build` (or at least `pnpm build-esm-prod`) after a source
change before trusting their result.

### E2E visual tests

Each directory in `samples/test_e2e/` is a sample plus a `test.js` that compares screenshots.

```bash
pnpm test-e2e                                    # all samples, native browser
pnpm test-e2e-part -- ./samples/test_e2e/<Sample>
pnpm test-e2e-update                             # rewrite the snapshots that fail (current environment)
E2E_WEBGPU_SMOKE=1 pnpm test-e2e                 # WebGPU cases only check that the sample runs

pnpm test-e2e:docker                             # strict run in the CI container (reference environment)
pnpm test-e2e:docker:update                      # regenerate every reference image in the container
pnpm test-e2e:docker:shell                       # shell inside the container
```

- The reference images come from the container (Linux, Mesa llvmpipe/lavapipe). Native runs on other machines apply a
  2% tolerance floor; the container and CI compare strictly.
- To regenerate one sample in the container: `npx vitest run --config ./config/test/vitest.config.e2e.ts
  ./samples/test_e2e/<Sample> --update=all` from the container shell. Do not write `--update ./samples/...`: the
  flag swallows the path and updates the whole suite.
- A rendering change that moves references in samples you did not expect is a signal, not noise: for example, the
  directional shadow fit affects every sample with a shadow-casting directional light
  ([design-notes/shadows.md](./design-notes/shadows.md)).
- The `TreeShaking` sample checks bundle contents and size budgets. If it fails, a core module started importing
  an optional feature ([design-notes/tree-shaking.md](./design-notes/tree-shaking.md)).

### Before opening a pull request

```bash
pnpm build && pnpm build-samples && pnpm check && pnpm test
```

## Adding things

### A component

1. Create `src/foundation/components/<Name>/<Name>Component.ts` extending `Component`, following an existing
   component of similar shape.
2. Give it a TID in `WellKnownComponentTIDs.ts` and export it from the component `index.ts`.
3. Do not register it at module top level. It is registered when first added to an entity
   (`engine.entityRepository.addComponentToEntity(<Name>Component, entity)`); a `create<Name>Entity` helper should add
   the class, not the TID.
4. If `Engine` must call into it every frame, register hooks with `registerComponentRuntimeHooks` instead of importing
   it from `Engine`.
5. Data that the shaders read must be declared as blittable members so that it is placed in the GPU instance data;
   look at `SceneGraphComponent` (`previousWorldMatrix`) or `SkeletalComponent` for examples.

### A material

Add a factory to `src/foundation/helpers/materials/` and export it from that `index.ts`. If it pulls in the shader
node library or another large subtree, export it from `optionalMaterials.ts` (the `rhodonite/optional-materials`
subpath) instead. Gate shader imports with `__RN_WEBGL__` / `__RN_WEBGPU__` as described in CLAUDE.md.

### A sample or E2E test

Copy a small existing sample in `samples/test_e2e/` (for example `Simple`). A sample signals the test that it is ready
by adding an element with the id `rendered`. Make the frame deterministic: render a fixed number of frames, and
await asynchronous engine setup that affects the image (e.g. `await engine._ensureLightClusterSystem()` when the first
frames must be lit).

## Debugging

- `Config` `{ logLevel: Rn.LogLevel.Debug, cgApiDebugConsoleOutput: true }` prints more of what the engine does.
- `dist/esmdev` has inline source maps. `__`-prefixed private members are renamed by the build's property mangling;
  grep `dist/esmdev` for the assignment to find the new name.
- Shader problems: hook `WebGL2RenderingContext.prototype.shaderSource` or `GPUDevice.prototype.createShaderModule`
  to see the generated source ([design-notes/performance-measurement.md](./design-notes/performance-measurement.md)).
  A shader source that contains a backtick fails when the program is created, not at build time (see CLAUDE.md).
- Performance: measure with the methods in
  [design-notes/performance-measurement.md](./design-notes/performance-measurement.md) before optimizing, and check the
  design notes for alternatives that were already measured and rejected.

## Releasing

`pnpm prepublishOnly` runs `preoutput` (build, build-samples and all tests). `pnpm pnpm-pack` creates the package
tarball. Bump `version` in `package.json` before packing.

## API documentation

`pnpm doc` regenerates the TypeDoc output in `docs/api/`. The `API Documents` workflow also builds it as an artifact.
