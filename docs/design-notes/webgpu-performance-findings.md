# WebGPU (and shader) performance findings

These findings explain where frame time goes. Read this before optimizing per-frame code: several plausible
optimizations were measured to do nothing.

## CPU time of `Engine.process()` in static scenes is mostly native calls

Measured on 2026-11-13 in RhodoniteEditor2 (`ToyCar.glb`, WebGPU, simple mode):

- With every GPU* native call stubbed out, `engine.process(frame)` costs ~2.5 µs in a hot loop, but ~70 µs when it
  runs once per rAF. The per-frame JavaScript is dominated by cold CPU caches (the application's JavaScript runs
  between frames), not by the amount of code. A fixed numeric loop does not show this effect, so it is not the CPU
  frequency.
- Native WebGPU calls through Chrome/Dawn IPC are the bulk: `getCurrentTexture` ~45 µs, the first `beginRenderPass`
  on the canvas ~45 µs, `submit` ~26 µs. A bare one-pass frame costs ~125–135 µs p50 in that browser. A CPU draw
  time below 100 µs is therefore bounded by the browser, not by Rhodonite.
- There were no GC events inside rAF in a 5 s trace. Minor GCs (~0.3–1.3 ms) ran between frames, about every 1.5 s.
- `performance.now()` had a 5 µs resolution, so single-call timings below that are noise. Compare native call
  patterns with interleaved A/B (alternate the variants every rAF).

**How to apply:** for further per-frame wins, reduce the number of native calls (render pass merging and deferred
clears in `WebGpuResourceRepository` are already done) or the number of distinct GPU objects touched per frame. Do
not micro-optimize JavaScript expressions.

## Many meshes: the browser's GPU process is the bottleneck

Measured on 2026-11-13 with `NodePerformanceTest.glb` (10k meshes and materials):

- Static frames were bound by Chrome's GPU process (Dawn replaying the render bundle into Metal), not by the GPU.
  `timestamp-query` showed ~1.8 ms of GPU time while the GPU process sat at ~100% CPU.
- Cutting the number of `setBindGroup` / `setPipeline` commands did nothing.
- Cutting the number of **distinct GPUBuffers referenced per frame** helped. 10k draw-parameter uniform buffers → ~10
  shared buffers: 15 → 28 fps.
- Packing the vertex and index buffers into sub-allocated ranges of a few large buffers (`WebGpuBufferArena`) then
  reached ~120 fps (vsync) in simple mode, and ~58 fps with shadows and bloom. The GPU process CPU fell from ~100%
  to ~65%.

**How to apply:** keep per-object GPU resources shared or sub-allocated. A new per-mesh or per-material `GPUBuffer`
scales the GPU process cost with the object count.

To measure: use `timestamp-query` (`engine.gpuTimerEnabled`) together with a CPU profile of the
`--type=gpu-process` process (for example `/usr/bin/sample <pid>` on macOS).

## Many materials

These per-material costs scaled with 10k materials on WebGL2, and were fixed on 2026-11-13:

- `ShadowSystem.setDepthBiasPV` wrote 96 floats to every material every frame.
- A new sampler was created per material for the default samplers, which forced a `bindSampler` per draw.
- `uniform1i` was called per texture per draw.
- IBL `setParameter` was called per material.
- An AABB/Locator gizmo on the glTF root dirtied its parent's AABB every update, which forced a full merge of 10k
  AABBs on every camera move.

When a heavy model "ignores mouse drag" in RhodoniteEditor2, check the camera selector first. Loading switches to the
glTF's own camera, which has no orbit controller. That, not performance, was most of the symptom.

## Shader findings (WebGPU PBR, 1000-point-light Sponza)

- **Shadow sampling inside the light loop** must be gated by `depthTextureIndex >= 0`: 18.5 → 12.5 ms GPU (see
  [shadows.md](./shadows.md#shader-cost-of-shadows)).
- **Hoisting the fragment-invariant terms out of the punctual light loop**, and skipping lights whose
  `attenuatedIntensity` is exactly 0 (the border of a cluster), gave a further ~16% GPU / ~12% wall time. The image
  was bit-identical to the parent shader.
- **`shader-f16` is not worthwhile.** The adapter supports it and the modules compile. But a compute benchmark of the
  PBR BRDF math (921,600 invocations × 256 iterations, 24 interleaved rounds) measured f32 at 2.49 ms and f16 at
  2.62 ms, so **f16 was ~5% slower**. The loop is heavy on sqrt and division and needs f32↔f16 conversions of the
  light inputs. f16 would also reduce the shading precision to a 10-bit mantissa. Revisit only on a different GPU or
  backend, with an A/B on a real scene.
- **Generated offset tables must be module-scope `const`s** (see
  [shadows.md](./shadows.md#shadow-cameras-are-attached-lazily)).

## Pixel identity across shader edits is not a valid check

On Apple/Metal WebGPU with the 1000-light Sponza, **any** shader edit flips the same ~17k pixels (1.8%; some up to
255 levels). Even `pow(d, 2.0)` → `d * d` does it, and two different edits produce identical results. Those pixels
are bimodal (undefined) in the original shader. So bit-exact comparison across shader edits means nothing there.

To verify "no visual change", require 0 px between the change and its immediate parent build (that pair does give
0 px when nothing changed), and also check visually.
