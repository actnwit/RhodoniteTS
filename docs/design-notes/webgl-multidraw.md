# WebGL2 multi-draw

Code: `src/webgl/MultiDraw.ts`, `src/webgl/MultiDrawRepository.ts`, `src/webgl/InstanceSidTable.ts`, and the
multi-draw paths of `src/webgl/WebGLStrategyWebGL2.ts`.
Switch: `Config.isMultiDrawEnabled` (default `true`; it requires `WEBGL_multi_draw` and the instance SID texture
support). Sample: `samples/test_e2e/MultiDraw`.

## What it does

- Primitives that share a source `Buffer` are merged into shared vertex and index buffers.
- Each vertex carries its instance base and material SID.
- The shader looks up the component SIDs from a SID table, and the SID and remap rows live inside the engine's
  data texture, so no extra texture unit is used. An invalid SID is stored as `-1.0` and restored with
  `uvec4(ivec4(record))`.
- Consecutive draws with the same render state are issued as one `WEBGL_multi_draw` call.

On a 10,000-primitive scene, this turns 10k draws into about 123 multi-draw calls.

## Measurements

Measured on 2026-11-14 with `NodePerformanceTest.glb` (10,000 primitives, 731,850 vertices, 10,000 materials),
Chrome/ANGLE-Metal on macOS, a 1000x1000 canvas, with both a static and a dragged camera. The ground truth is the
frame time (the rAF-to-rAF interval).

| Path | CPU `process()` | Frame |
|---|---|---|
| Legacy (`isMultiDrawEnabled = false`) | ~44 ms | ~44 ms (~23 fps) |
| Merged multi-draw | ~16 ms | ~19.2 ms (~52 fps) |

### `gpuTimeMilliseconds` over-reports on WebGL2

On WebGL2, `engine.gpuTimeMilliseconds` is an `EXT_disjoint_timer_query` `TIME_ELAPSED` span over the whole
`process()`. That span includes the time the GPU sits idle while the CPU sorts and submits. When the CPU and GPU
overlap, it can exceed the real frame interval: one run reported 23.7 ms with a 19.2 ms frame. A "GPU time tripled"
reading after enabling multi-draw was this artifact.

Judge this path by the frame time or the CPU `process()` time, not by the timer alone. Enabling the timer itself
costs nothing measurable.

## Rejected: capping the group size

Several experiments tried to make the merged groups smaller or to change how they are drawn:

- 4, 5, 8 or 100 primitives per group, or a cap by vertex count
- padding each buffer (8 KB per VBO)
- per-draw calls instead of multi-draw, or a different draw order
- removing the SID fetch, or moving the material SID to a uniform
- a constant fragment shader

None of them improved the frame time. With 4 primitives per group, the timer reading dropped to ~7 ms but the
frame got worse (26.8 ms vs 19.2 ms), because there are more runs and more state setup. Keep whole-buffer grouping
uncapped.

## CPU-side structure (kept)

The CPU pass went from 45.6 ms to 16.4 ms while dragging. These changes produced that drop; keep them when
touching the code:

- `RenderPass._lastPrimitives` is an array parallel to the primitive UIDs, so the strategy does not call
  `Primitive.getPrimitive` every frame.
- The mesh renderer fingerprint is interned as a numeric id (`getPrimitiveMeshRendererFingerPrintId`), and so is
  the render state key (`getMultiDrawStateKeyId`, a WeakMap with numeric ids). Never compare long state-key strings
  per frame.
- `planMultiDrawRunsInto` plans the runs into typed arrays: one key evaluation per primitive and no per-run objects.
- The sort scratch and the culling scratch are reused. When nothing was culled, the instance remap prepass is
  skipped; a per-mesh visit stamp replaces a `Set`.
- `vertexAttribI4ui` is skipped for grouped primitives.

## Debugging tips

- The GLSL is assembled at runtime. Hooking `WebGL2RenderingContext.prototype.shaderSource` lets you A/B shader
  variants without rebuilding.
- The engine calls `gl.disable(SCISSOR_TEST)` for each material state, so a scissor-based fragment-cost test does
  not measure anything.

## Remaining floor on that scene

Without multi-draw, ~10k native draw sequences (`uniform1fv` + `bindVertexArray` + `drawElementsInstanced`) cost
~40–45 ms. Fixing the per-material costs listed in [webgpu-performance-findings.md](./webgpu-performance-findings.md#many-materials)
did not remove it; batching does.
