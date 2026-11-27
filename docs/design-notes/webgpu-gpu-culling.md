# WebGPU GPU culling and compute skinning

Code: `src/webgpu/WebGpuGpuCulling.ts`, `src/webgpu/GpuCullingRegistry.ts`, `src/webgpu/RangeAllocator.ts`,
`src/webgpu/WebGpuVertexDeformer.ts`, `src/webgpu/GpuDeformRegistry.ts`, the draw and bundle-cache code in
`src/webgpu/WebGpuResourceRepository.ts`, and `MeshRendererComponent._isGpuCullingActive`.
Switches: `Config.isGpuCullingEnabled` and `Config.isComputeSkinningEnabled` (both default `true`, WebGPU only).
Samples: `WebGpuGpuCulling`, `WebGpuSkinnedGpuCulling`.

## Design

The design follows the object-culling pattern of toji.dev's "Render Bundles" article. Culling is frustum-only.

- Each frame, one compute pass culls the instances against the render pass camera's frustum. It is submitted
  before the frame's render commands in `flush()`.
- The pass writes the visible instances and the instance counts for `drawIndexedIndirect`.
- The render bundles record the indirect draws. So a moving camera no longer forces bundle re-recording, and the
  instances of an instanced mesh are culled one by one.
- The compacted visible-instance buffer has the same layout as the variation VBO (uint32x4 SIDs) and is bound to
  vertex slot 0. No shader changes are needed, and `firstInstance` stays 0, so the `indirect-first-instance`
  feature is not required.
- `GpuCullingRegistry` manages the instance and chunk ranges with `RangeAllocator`. Group and draw slots are owned
  by bundle keys and released only after submit. On overflow, the buffers grow ×2, the registry resets and the
  bundles are cleared.
- A culled mesh still records its draw with zero instances, so its pipeline and bind groups are still set.

### Four passes, 64-instance chunks

The first version used one workgroup per group. That serialised a 10k-instance mesh: the cull pass took 1.31 ms of
GPU time. The current version splits the instances into 64-instance chunks (`CHUNK_SIZE`) and runs four passes in
one compute pass:

1. `cullChunks`: each chunk tests its instances and compacts the visible ones within its own slots.
2. `prefixGroups`: one invocation per group sums its chunks' counts in order.
3. `scatter`: each chunk copies its visible instances to the group's output range.
4. `finalize`: writes each indirect draw's instance count.

The cull pass dropped to 0.066 ms. The passes preserve order and use no atomics, so the output is deterministic,
which blending and the E2E screenshots need.

### Measurements

Measured on 2026-11-21: Chromium on Apple Metal, 10k instanced cubes plus 500 unique spheres, with an orbiting
camera.

- `engine.process` went from 8.9 ms to 5.1 ms.
- No bundle was re-recorded while orbiting. With CPU culling, the bundles were re-recorded every time the visible
  set changed.
- Pixel A/B against CPU culling: 0 px difference on 12 WebGPU samples.

### Bug found on the way

`_isChangedSortRenderResult` compared only the blend range. A swapped opaque primitive could therefore reuse a stale
bundle. It now compares the opaque range too.

## Compute skinning and morphing

With `isComputeSkinningEnabled`, skinned and morphed meshes are culled on the GPU too.

- Once per frame, `WebGpuVertexDeformer` applies the blend shapes and then the skinning to every instance.
- The deformed vertices (local space, two vec4s each) go to a storage buffer at group 0, binding 4.
- `instanceIds.w` holds the deformed base + 1, and routes the vertex shader's `processGeometry` to read the
  deformed data. `w = 0` falls back to vertex-shader skinning.
- Each primitive's offset is passed in `UniformDrawParameters.deformedVertexOffset`.
- The deform pass also writes each instance's AABB with ordered-float atomics (`encodeOrderedFloat` in
  `GpuDeformRegistry.ts`). The cull pass reads it for the instances flagged DEFORMED.
- The bone decoding is shared with the vertex shaders in `common/boneDecode.wgsl`.
- The CPU approximation test is kept only for `SkeletalComponent._isCulled`.

Draws that are not GPU culled (for example when the culling tables are full, or in a multi-view pass) keep the
vertex-shader deformation. The A/B against vertex-shader skinning showed 0–10 px differences, with a max diff of
≤3 except one silhouette pixel.

When TAA is on, the motion vector shader re-deforms from the vertex attributes, on the compute-skinning path too
(see [temporal-aa.md](./temporal-aa.md)).

## How to A/B a WebGPU sample without editing it

Intercept the sample's `main.js` with Playwright's `page.route`, and wrap `Rn.Engine.init` to force the config flag
and expose the engine (`window.__engine`). Then diff the screenshots with `pixelmatch`. See
[performance-measurement.md](./performance-measurement.md).
