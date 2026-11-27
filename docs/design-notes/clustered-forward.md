# Clustered Forward lighting

Code: `src/foundation/renderer/lightCluster/` (`LightClusterSystem.ts`, `LightClusterBuilder.ts`,
`LightClusterLayout.ts`, `LightClusterSystemStub.ts`), `src/webgpu/WebGpuLightClusterBuilder.ts`.
Sample: `samples/test_e2e/ClusteredForward` (`?cluster=off`, `?build=cpu`).

## What it does

The view frustum of each camera is split into a grid of clusters (froxels). Every frame the point and spot lights
that have a range are assigned to the clusters they reach, and a fragment shades only the lights of its own
cluster. Directional lights and lights without a range are evaluated by every fragment.

- `clusteredForwardBuildMode: 'auto'` builds the clusters with a WGSL compute shader on WebGPU and on the CPU on
  WebGL2. `'cpu'` uses the CPU builder on both backends.
- With fewer than `clusteredForwardMinLocalLightNumber` cullable lights, no clusters are built and every fragment
  loops over all lights as in plain forward rendering.
- At most `clusteredForwardMaxViewNumber` cameras get clusters in one frame. The others evaluate all lights.

## The builder: bounded work per cluster

The current builder follows the design of three.js's clustered lighting:

1. The CPU sorts the local lights of the view by view depth every frame.
2. It uploads the sorted light spheres and entries, plus a `[start, end)` light range for each Z slice.
3. Both builders (WGSL and CPU) give each cluster a fixed slot of `ceil(capacity / 4)` vec4s
   (`LightClusterLayout.ts`). A cluster walks only the lights of its Z slice and stops when its slot is full.

There are no atomics, no counting pass, no prefix sum and no overflow fallback, so the work of each cluster is
bounded. When more lights reach a cluster than `clusteredForwardLightCapacityPerCluster`, it keeps the nearest
ones. Because the lights are sorted by depth, the dropped lights are the farthest.

**Rejected / replaced:** an earlier builder wrote one dense list shared by all clusters, and truncated by light
SID order. A finer grid made it blow up, and the truncation dropped lights arbitrarily. Do not reintroduce a shared
dense list on the GPU or SID-order truncation.

## Why the defaults

Measured on 2026-11-17 with Sponza and 1000 animated point lights (WebGPU, Apple M2 Max, Chrome; the camera yaws
every frame).

- **Capacity 96.** Comparison against the old builder's image at 1280x720 with a 48x27 grid:
  - capacity 64: 20,090 px differ (max diff 103)
  - capacity 96: 357 px differ (max 3)
  - capacity 128: 7 px differ (max 1)

  At that time the GPU time was 4.78 ms (new builder) vs 5.64 ms (old builder).
- **Finer screen grids stopped costing more.** With the new builder at capacity 64 and 1920x1080, 48x27, 96x54
  and 128x72 all took about 6.8–6.95 ms GPU.
- **Grid `[48, 27, 48]`.** The X/Y size gives about 40-pixel tiles at 1920x1080. Raising Z from 24 to 48 was the
  larger lever for the 1000-light scene; the depth prepass gave little on top of it
  ([webgpu-depth-prepass.md](./webgpu-depth-prepass.md)).
- **Memory.** About `16 * clusterCount * ceil(capacity / 4)` bytes per camera. With the defaults that is
  62,208 clusters × 24 vec4s ≈ 25 MB. This is why `clusteredForwardMaxViewNumber` stays small (4).
- **`clusteredForwardMinLocalLightNumber = 1`.** This is the measured break-even point of both backends. The
  table is in the doc comment of `Config.clusteredForwardMinLocalLightNumber`.
- **WebGL2 for comparison.** WebGL2 builds on the CPU (it has no compute shaders). For the same scene with the
  defaults of that day, the cluster build took ~10.7 ms per frame, with ~12 ms CPU and a ~26 ms frame at 1280x720.

`Config.lightAutoRangeThreshold` and `Config.lightRangeScale` let lights without a range be culled, or trade
light reach for speed. Their measured presets are in their doc comments.

## Lazy loading

`Engine` starts with `LightClusterSystemStub`. The first `LightComponent` calls `engine._requestLightClusterSystem()`,
which dynamically imports the real system. A page without lights never downloads that chunk; the `TreeShaking`
E2E test checks this.

The real system is needed even when `isClusteredForwardEnabled` is `false`, because it also owns the list of all
lights. So the request is not gated by that flag.

Code that must render lit frames from the very first frame calls `await engine._ensureLightClusterSystem()` first.
The TAA samples do this: otherwise the unlit first frames stay in the TAA history.

## Pitfalls

- **Unit tests.** `ProcessApproach.None` allocates only 16 MB of GPU instance data. One view's cluster region does
  not fit the default layer ratios, so `LightClusterSystem.test.ts` appends a layer ratio of `1` in `createScene`.
- **More than 4 cameras.** This works on WebGPU, since the views land in the larger layers, but each camera costs
  the memory above.
