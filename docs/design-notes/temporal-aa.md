# Temporal anti-aliasing

Code: `src/foundation/renderer/TemporalAA/` (`TemporalAASystem.ts`, `PreviousFrameDataTracker.ts`),
`createMotionVectorMaterial`, `createTemporalAAResolveMaterial`, the `MotionVectorShader` and
`TemporalAAResolveShader` shaders.
Switch: `ForwardRenderPipeline.setup(width, height, { isTemporalAA: true })`. It replaces the 4x MSAA. It is off in
simple mode and in WebXR.
Samples: `TemporalAA` (`?taa=off`, `?frames=N`), `TemporalAADeformation`.

## Each frame

1. **Before `Engine.process`**, `prepareFrame` does three things:
   - It jitters the camera projection by a Halton(2, 3) sub-pixel offset (`getTemporalAAJitter`).
   - It records the previous frame's world matrices, bone data and view-projection matrix.
   - The strategies keep the previous blend shape weights.
2. **Motion vector pass.** It draws the opaque primitives with the motion vector material into an RGBA16F target:
   xy is the motion in texture coordinates, z is the depth.
3. **Resolve pass.** It blends the current frame with the history, reprojected by the motion vectors. It uses
   Catmull-Rom history sampling, variance clipping in YCoCg and inverse luminance weighting. It writes the output
   and copies it into the history target.

Public controls on the pipeline: `isTemporalAA`, `resetTemporalAAHistory()`, `temporalAACurrentFrameWeight`.

## Previous-frame data

| Data | Where | Cost without TAA |
|---|---|---|
| World matrix | `SceneGraphComponent` blittable member `previousWorldMatrix` (`get_previousWorldMatrix` in the shaders), registered last | one matrix per node |
| Bone data | `SkeletalComponent` variable-length member `previousBoneData` plus its location and info. Info `w = -1` means "not received yet" | a single vec4 until `_enablePreviousBoneData()` is called |
| Morph weights | `Engine._enablePreviousMorphWeights()` doubles the morph weights UBO. The previous section is at `BlendShapeComponent._getPreviousMorphWeightsOffset()`. The strategies generate `get_previousMorphedPosition` | none until enabled |

`PreviousFrameDataTracker` writes the previous data. It copies only when the raw bits differ, and it keys the world
matrices on `SceneGraphComponent.worldMatrixVersion`.

Setting the jitter calls `engine._markGpuInstanceDataDirty()`. That bumps `_gpuInstanceDataVersion`, which both
strategies compare in their prerender to re-upload the GPU instance data. It deliberately does not bump the
camera's `__updateCount`.

## Deviation from the original plan

The plan was to draw only the moving objects in the motion vector pass, and to reproject the static ones from the
main depth buffer. Sampling the main depth texture in WebGPU needs a depth/unfilterable bind group layout, while
the texture layouts default to `sampleType: 'float'`. So the motion vector pass draws **all** opaque entities, with
its own Depth32F.

## Skinned and morphed motion

The motion vector shader deforms each vertex a second time, from the vertex attributes, with the previous bone
data and morph weights. It does this on the WebGPU compute-skinning path as well.

The motion vector material must declare `definitions: ['RN_IS_SKINNING', 'RN_IS_MORPHING']` and `isMorphing`.
Otherwise WebGL2 fails on `u_currentPrimitiveIdx`, because uniform reflection only sees uniforms inside active
`#ifdef`s.

Check: reprojecting frame N−1 with the motion vectors of the running Fox model reduced the color error from 13.1 to
4.1.

## Related engine changes

- `RenderPass._copyResolve1ToResolve2WebGpu` copies the render target when there is no resolve target. The history
  copy needs this, and so does the transmission back buffer without MSAA.
- `CameraComponent` keeps the projection without jitter (`__projectionMatrixWithoutJitter`) next to the jittered
  one.

## Measurements

Apple GPU, 1280x720 Sponza: WebGPU GPU time was 1.9–2.4 ms with MSAA and 2.7–2.8 ms with TAA. WebGL2 was noisy and
similar. On static 10k cubes, CPU `process` was lower with TAA on than off; the cause was not investigated.

## Pitfalls

- **E2E.** TAA samples must `await engine._ensureLightClusterSystem()` before rendering. Otherwise the first frames,
  rendered before the light cluster system loads, are unlit; how many there are depends on timing, and they leave a
  residue in the history. This showed up as CI-only diffs on thin geometry.
- **Debugging dist builds.** `__`-prefixed members are mangled in `dist/` (see
  [tree-shaking.md](./tree-shaking.md#property-mangling)). To find a private field in the browser, grep
  `dist/esmdev` for the assignment.

## Not yet covered

SDF/raymarching objects have no motion vectors. The next planned stages (SSAO/SSR) build on this motion vector
and history infrastructure.
