# Performance measurement

How the numbers in these notes were measured, and what to avoid. The common rule: compare the variants **in the
same page or session, interleaved, over several rounds, and use medians**. Separate runs drift with machine load and
thermal state by more than most of the effects being measured.

## What to read

| Metric | How | Caveat |
|---|---|---|
| CPU time per frame | Wrap `engine.process` and average it. For per-component cost, wrap `Rn.Component.process` (per type and stage). | `performance.now()` can be as coarse as 5 µs. |
| GPU time (WebGPU) | `engine.gpuTimerEnabled = true`, then read `engine.gpuTimeMilliseconds` and `engine.gpuPassTimesMilliseconds` (per pass label). | Needs `timestamp-query`. Per-frame values are noisy, so compare medians. |
| GPU time (WebGL2) | Same API (`EXT_disjoint_timer_query`) | It spans the whole `process()` and over-reports when the CPU and GPU overlap. Use the frame time instead (see [webgl-multidraw.md](./webgl-multidraw.md#gputimemilliseconds-over-reports-on-webgl2)). |
| Frame time | The rAF-to-rAF interval | The ground truth, but capped by vsync. Some automated browsers cap rAF at ~30 fps regardless of load. |
| Wall time of N frames | Call `engine.process` K times in a plain loop (no rAF), then sync with `await device.queue.onSubmittedWorkDone()` (WebGPU) or a 1-pixel `gl.readPixels` (WebGL2) | Good for GPU-bound comparisons. |

Frustum culling changes crowd-scene profiles a lot. Measure both the default camera and an "all visible" case:
set `Rn.MeshRendererComponent._isFrustumCullingEnabled = false`.

Always use the asset's own camera or a known camera path. An orbit camera that misses the scene renders black and
hides the cost.

## Comparing two builds without a worktree

`dist/esmdev/index.js` is tracked and self-contained, so two builds can be loaded side by side:

1. Extract the baseline: `git show HEAD:dist/esmdev/index.js > <dir>/before.js`.
2. Build the change and copy it to `<dir>/after.js`.
3. Serve a page that imports both. Create one engine and canvas per build on the same asset, and alternate
   `engine.process` batches.

One engine per page load (`?only=before|after`, alternating page loads) gave steadier numbers than two engines in
one page. For correctness checks, always use one engine per fresh page: engines in one page share module state.

The `pnpm start` server (`server.js`, port 8082) serves the repository root statically, so a scratch directory such
as `node_modules/<dir>/` is reachable. Static serving ignores directories whose name starts with a dot.

Shader-only changes need only `pnpm build-esm-dev`, not the full `pnpm build`.

Always diff baseline against baseline first to get the noise floor. WebGL2 was deterministic (0 px) on the
measurement machine.

## Pixel A/B

- **WebGL2.** Patch `HTMLCanvasElement.prototype.getContext` early to force `preserveDrawingBuffer: true`. Wait for
  `p#rendered` plus 20–30 rAFs, then `drawImage` the canvas into a 2D canvas and diff the `ImageData`.
- **WebGPU.** Wrap `engine.process` and grab the canvas right after it returns, in the same task. Grabbing outside
  the frame task returned stale or blank data.
- For WebGPU samples that you do not want to edit, intercept `main.js` (for example with Playwright `page.route`),
  wrap `Rn.Engine.init` to force a `Config` flag, and expose the engine.
- See [webgpu-performance-findings.md](./webgpu-performance-findings.md#pixel-identity-across-shader-edits-is-not-a-valid-check)
  for why bit-exact identity across shader edits can be meaningless.

## Shader experiments without rebuilding

- **WebGL2.** Patch `WebGL2RenderingContext.prototype.shaderSource` before `Engine.init`, and rewrite or record the
  sources.
- **WebGPU.** Patch `device.createShaderModule` right after `Engine.init`.

### Auditing `discard`

Record the sources with the hooks above, and keep only the pixel shaders (`RN_IS_PIXEL_SHADER` in GLSL, `@fragment`
in WGSL). Strip the comments, then search for `discard;`.

## Running E2E while a dev server holds port 8082

`vitest-puppeteer.config.js` uses `usedPortAction: 'error'`. Copy it with `usedPortAction: 'ignore'` and pass it
via `VITEST_PUPPETEER_CONFIG=<path> pnpm test-e2e-part samples/test_e2e/<Name>/`.

## Benchmark scenes used in these notes

- **Sponza with 1000 point lights** (Sponza plus an animated `LightShow`), and a variant with 500 point + 500 spot
  lights and a 41-second camera tour (`TourCamera` / `CameraTour` animation). These are local assets, not in the
  repository.

  The measurements used `Config` `{ clusteredForwardGridSize: [48, 27, 48], clusteredForwardLightCapacityPerCluster:
  96, maxLightNumber: 6, lightAutoRangeThreshold: 0.01 }` and `ForwardRenderPipeline.setup(..., { isShadow: true,
  isSimple: true })`. The time was advanced by `AnimationComponent.setGlobalTime(engine, t += 1 / 60)` per frame.
- **`NodePerformanceTest.glb`**: 10k nodes, primitives and materials. Load it with `shadow: true` to match
  RhodoniteEditor2; without it, the shadow-related costs vanish.
- **10k instanced cubes plus 500 unique spheres** with an orbiting camera (GPU culling).
