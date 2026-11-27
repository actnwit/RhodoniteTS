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
3. **Resolve pass.** It blends the current frame with the history, reprojected by the motion vectors. The current
   frame is reconstructed from its 3x3 neighborhood with a filter centered on the pixel. It uses Catmull-Rom history
   sampling, variance clipping in YCoCg towards the current color, inverse luminance weighting, and a smaller
   weight of the current frame for pixels that do not move (see "Flicker in still images"). It writes the output
   and copies it into the history target.

Public controls on the pipeline: `isTemporalAA`, `resetTemporalAAHistory()`, `temporalAACurrentFrameWeight`
(moving pixels, default 0.1), `temporalAAStaticFrameWeight` (still pixels, default 0.04).

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

## Flicker in still images

With a plain exponential blend (weight 0.1), the 8-frame jitter sequence and a variance box clipped towards its
mean, still images flickered at edges. Four changes in the resolve shader fix it; each one was found by measuring,
not by reasoning alone, and two earlier guesses were wrong.

1. **Reconstruction filter of the current frame.** The current color is the 3x3 neighborhood weighted by
   `exp(-2.29 d^2)` (the Gaussian fit of Blackman-Harris used by Unreal), where `d` is the distance in pixels from
   the pixel center to the position each neighbor sampled. The jitter moves the geometry by `currentJitter`, so a
   pixel samples the scene at `-currentJitter`; WebGPU flips y because its v axis points down. Flipping the sign
   made the flicker 2.4x worse and the image softer, which is how the sign was checked.
2. **Per-pixel weight of the current frame.** `mix(staticFrameWeight 0.04, currentFrameWeight 0.1, saturate(speed
   in pixels))`, floored by `1 / (historyFrameCount + 1)` so that the first frames after a reset are an even
   average. The blend weights the newest sample of the jitter sequence more than the oldest; a smaller weight
   averages the sequence more evenly. `historyFrameCount` is counted by `TemporalAASystem` (reset with the history),
   not per pixel.
3. **Clip towards the reconstructed current color, with a tolerance.** This was the main cause on real models
   (ABeautifulGame). The box is built in YCoCg, and the chroma of grays is almost 0, so the chroma extents of the
   box were almost 0 as well. A chroma difference of 1e-4 then triggered the clip, which scaled the whole vector
   towards the box center/mean, so the *luminance* moved too: a background pixel next to a white chess piece, whose
   current samples were 0 in every frame, was pulled up to 0.36 once per jitter sequence and decayed in between
   (a sawtooth of up to 66 levels in 8-bit sRGB). Now the history is clipped along the line towards the
   reconstructed current color, which the box always contains (together with the pixel's own sample), so the
   result lies between the history and the current color. The distance to the box is measured with a tolerance of
   `1e-4 + 0.01 * (Y_current + Y_history)`.
4. **Box grown by the still pixels 2 pixels away.** The reconstruction filter spreads a surface into the pixels
   beside it; in the frames where the jitter puts the 3x3 samples of such a pixel all on the other side, the
   variance box collapses (sigma = 0) and clips the accumulated value away. The colors 2 pixels away in the 4 axis
   directions are added to the box, but only where those pixels do not move (motion < 0.5 pixels): including
   moving pixels kept the stale history of a moving cube alive as a 1-pixel line behind it.

Tried and dropped: weighting the filter samples by inverse luminance (Karis) made no measurable difference once the
clipping was fixed, and darkens bright/dark edges; a longer jitter sequence (16, 32) increased the ripple in a CPU
replica.

Measured with a per-pixel peak-to-peak of the displayed 8-bit luma over 32 frames, after 120 frames of warm-up:

| Scene | Variant | Sum | > 4 | > 8 | > 16 | Max |
|---|---|---|---|---|---|---|
| `TemporalAA` sample, `?move=off&frames=0`, 600x600 | Before | 44.6k | 2703 | 2229 | 865 | 46 |
| | After | 11.3k | 52 | 0 | 0 | 8 |
| ABeautifulGame, 960x540, shadow + bloom + IBL | Before | 200k | 9872 | 3776 | 1390 | 55 |
| | Changes 1 + 2 only | 66k | 3048 | 615 | 194 | 66 |
| | After | 26.8k | 154 | 2 | 0 | 9 |

WebGL2 and WebGPU gave the same numbers. The gradient sum of the still image dropped by 4% (`TemporalAA`) and 5%
(ABeautifulGame): the reconstruction filter softens edges slightly. With the camera orbiting at 0.6 degrees per
frame, the frame looked the same as before (gradient -1%, no trails), and the moving cube of the 24-frame sample
showed no trail. `staticFrameWeight` 0.02 halves the remaining ripple again but slows the response to lighting
changes, so the default stays at 0.04.

How these were found: a scratch page loading the model with the editor's pipeline setup, `engine.process` wrapped
to grab the canvas every frame, and, for the bug in 3, `gl.readPixels` of the RGBA16F history, current and motion
vector textures at one pixel around the frame where it jumped (the `TemporalAASystem` and its framebuffers are
reachable from the pipeline under mangled names). A CPU replica of the resolve is useful for trying variants, but
it is single-channel, so it could not show the chroma coupling of 3.

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
