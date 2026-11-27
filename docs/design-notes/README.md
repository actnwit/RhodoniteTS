# Design notes

These notes record the reasoning behind the rendering and performance features that were added in 2026-11
(Clustered Forward, GPU culling, TAA, tree shaking, ...): why a design was chosen, which alternatives were
measured and rejected, the numbers that set the defaults, and the pitfalls found on the way. The code and its
comments describe *what* the engine does; these notes describe *why*, which the code cannot.

The measurements are snapshots. Each note states the date and the environment (mostly an Apple M2 Max with
Chrome; ANGLE-Metal for WebGL2, Dawn-Metal for WebGPU). Re-measure before relying on a number for a new decision.
[Performance measurement](./performance-measurement.md) describes how.

## Feature map

| Feature | Switch (default) | Main code | E2E sample | Note |
|---|---|---|---|---|
| Clustered Forward lighting | `Config.isClusteredForwardEnabled` (`true`), `clusteredForward*` | `src/foundation/renderer/lightCluster/`, `src/webgpu/WebGpuLightClusterBuilder.ts` | `ClusteredForward` | [clustered-forward.md](./clustered-forward.md) |
| Shadow maps (VSM, multiple lights) | `ForwardRenderPipeline.setup({ isShadow })`, `ShadowSystem` | `src/foundation/helpers/Shadow/ShadowSystem.ts` | `MultipleLightsShadowMap`, `RaymarchingShadow` | [shadows.md](./shadows.md) |
| WebGL2 multi-draw | `Config.isMultiDrawEnabled` (`true`) | `src/webgl/MultiDraw.ts`, `MultiDrawRepository.ts`, `InstanceSidTable.ts` | `MultiDraw` | [webgl-multidraw.md](./webgl-multidraw.md) |
| WebGPU GPU frustum culling | `Config.isGpuCullingEnabled` (`true`) | `src/webgpu/WebGpuGpuCulling.ts`, `GpuCullingRegistry.ts`, `RangeAllocator.ts` | `WebGpuGpuCulling` | [webgpu-gpu-culling.md](./webgpu-gpu-culling.md) |
| WebGPU compute skinning / morphing | `Config.isComputeSkinningEnabled` (`true`) | `src/webgpu/WebGpuVertexDeformer.ts`, `GpuDeformRegistry.ts` | `WebGpuSkinnedGpuCulling` | [webgpu-gpu-culling.md](./webgpu-gpu-culling.md#compute-skinning-and-morphing) |
| WebGPU depth prepass | `Config.isDepthPrepassEnabled` (`false`) | `src/webgpu/WebGpuStrategyBasic.ts` | — | [webgpu-depth-prepass.md](./webgpu-depth-prepass.md) |
| Temporal anti-aliasing | `ForwardRenderPipeline.setup({ isTemporalAA })` (`false`) | `src/foundation/renderer/TemporalAA/` | `TemporalAA`, `TemporalAADeformation` | [temporal-aa.md](./temporal-aa.md) |
| Scene graph update | — | `src/foundation/components/SceneGraph/SceneGraphComponent.ts` | — | [scenegraph-update.md](./scenegraph-update.md) |
| Tree-shakeable ESM build | `package.json` `exports` / `sideEffects`, `__RN_WEBGL__` / `__RN_WEBGPU__` | `config/esbuild/unbundled.mjs`, `build.mjs` | `TreeShaking` | [tree-shaking.md](./tree-shaking.md) |
| WebGPU CPU/GPU cost findings | — | `src/webgpu/WebGpuBufferArena.ts`, generated shader code | — | [webgpu-performance-findings.md](./webgpu-performance-findings.md) |

## Where a frame goes

To read the code in the order a frame runs, start from these files. Every feature above is attached at one of them.

1. `Engine.process()` (`src/foundation/system/Engine.ts`) runs the component stages (Logic, PreRender, Render) for each
   render pass of the given expressions.
2. `ForwardRenderPipeline` (`src/foundation/renderer/pipelines/ForwardRenderPipeline.ts`) builds those expressions:
   shadow maps, the main pass, transmission, TAA or MSAA resolve, bloom and tone mapping.
3. The backend strategies draw: `src/webgl/WebGLStrategyWebGL2.ts` and `src/webgpu/WebGpuStrategyBasic.ts`. Each one
   generates the shader accessors for the GPU instance data and records the draws.
4. `Config` (`src/foundation/core/Config.ts`) lists the switches. Its doc comments include the measured trade-offs
   of several defaults.
