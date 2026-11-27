# Shadows

Code: `src/foundation/helpers/Shadow/ShadowSystem.ts`, `attachLightShadowCamera` in
`src/foundation/helpers/EntityHelper.ts`, `ModelConverter.__setupLight`.
Samples: `MultipleLightsShadowMap`, `ClusteredForward`, `RaymarchingShadow`, `RaymarchingCastShadow`.

## Shadow cameras are attached lazily

Each light that gets a shadow-map slot needs a synchronized `CameraComponent`. The camera is attached only when
it is needed:

- The glTF importer attaches it only to lights whose `castShadow` is set.
- `ShadowSystem.getExpressions` attaches it when it assigns a shadow slot to a light.

**Why.** An earlier change attached a camera to every imported spot and directional light. On a scene with 500
point and 500 spot lights, this created 505 camera components. With `Config.cameraComponentCountPerBufferView = 1`,
every camera is a buffer view, and the generated shader accessor tables have one entry per buffer view. So the
tables grew from 5 to 505 entries. Because they were declared inside the accessor functions, they were
re-initialized on every call, per vertex and per fragment.

Measurement (2026-11-23, WebGPU, 1280x720):

| | 5 cameras | 505 cameras |
|---|---|---|
| Main pass GPU | 11.1 ms | 62.9 ms |
| Total GPU | 13.9 ms | 66.7 ms |
| `engine.process` CPU | 5.0 ms | 10.2 ms |

Two fixes went in:

1. The lazy attachment described above.
2. Both strategies now declare every generated offset table at module scope as a `const`: the component
   accessors, the morph arrays and the material offsets (see the comment near the table generation in
   `WebGpuStrategyBasic.ts`).

After both fixes, the main pass was back to 11.4 ms, and the screenshot was byte-identical to the build before the
regression. Keep the tables at module scope; a function-local array makes shader cost grow with the number of
buffer views.

## Directional light volume fitting and VSM penumbra

`ShadowSystem.__applyAutoFitToDirectionalLights` fits the orthographic shadow camera of each shadow-casting
directional light:

- It projects the merged world bounds into light space (the inverse of the light's world matrix, then
  `AABB.multiplyMatrixTo`).
- It applies margins of 1.15 to the extent and 1.25 to the depth.
- The merged bounds include the visible meshes and every visible `RaymarchingComponent`'s
  `worldMergedAABBWithSkeletal`, which already contains the SDF bounds.
- The fit is cached. The cache key includes the transform update count, the entity count, the raymarching
  component count and `RaymarchingComponent.getAABBVersion(engine)`.

**Why a tight fit matters.** The VSM Gaussian blur radius is fixed in shadow-map texels, so the world-space penumbra
grows with the fitted volume. The former bounding-sphere fit (`radius + distance`) produced very soft gradients
that washed the cast shadows out. The light-space AABB fit gives crisp, correctly sized shadows.

**Consequences:**

- Changing the fit changes the softness of every directional shadow. Expect E2E reference diffs in every sample
  with a shadow-casting directional light, not only in the raymarching samples. Check that they became sharper
  rather than broken, then regenerate only those samples in the CI container (see
  [CLAUDE.md](../../CLAUDE.md), "Filtered reference updates").
- SDF casters must stay inside the fitted volume. Do not exclude the SDF bounds from the merge.

## Shader cost of shadows

In the WebGPU PBR and Classic shaders, a light's shadow contribution is computed only inside
`if (depthTextureIndex >= 0)`. The WebGL2 shaders already worked this way. The WebGPU ports used to sample the
shadow textures twice and call `get_depthBiasPV` for every light of every fragment.

Fixing this on the 1000-point-light Sponza (2026-11-17, 1280x720) took the GPU median from 18.5 to 12.5 ms.
