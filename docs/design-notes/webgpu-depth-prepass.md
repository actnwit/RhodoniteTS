# WebGPU depth prepass

Code: the opaque-range drawing in `WebGpuStrategyBasic` (look for `isDepthPrepassEnabled`).
Switch: `Config.isDepthPrepassEnabled` (default `false`, WebGPU only; WebGL2 ignores it).

## Design

- Before the opaque color draws, the strategy records a depth-only draw for each primitive of the opaque range.
  These draws go in the same render pass and the same render bundle, so render bundle caching is unaffected.
- The depth-only pipeline is a variant of each material/primitive's color pipeline. It shares the pipeline layout,
  bind groups, vertex module and vertex buffers. Its fragment module is empty (`@fragment fn main() {}`), its
  color targets have `writeMask: 0`, and it writes depth.
- The color pass then tests depth with `less-equal`.

**Excluded, to stay correct:**

- `AlphaMode.Mask`, alpha-to-coverage, materials with the `RN_USE_WIREFRAME` define, and every blend bucket. These
  keep their normal draw and depth write.
- Render passes with a material override (shadow maps, post effects) or without a depth attachment.

Without the Mask exclusion, the prepass hid surfaces behind discarded foliage (21,284 px difference). With it, the
difference is 260–402 px (max ~81–112) on 0.9–2 MP frames. Those pixels sit on exactly coplanar surfaces, where the
color pass accepts equal depth.

A material that discards in any other way must not be used with this option.

## Why it is off by default

Measured on 2026-11-17 on the 1000-point-light Sponza (WebGPU, Apple M2 Max; the machine was thermally throttled
during the 1080p runs):

| Resolution | GPU | Wall |
|---|---|---|
| 1280x720, animated | 4.46 → 4.13 ms (−7%) | 6.88 → 6.12 ms (noisy) |
| 1920x1080, animated | median 9.11 → 7.21 ms; best 7.14 → 6.75 ms (−5.5%) | 10.98 → 9.58 ms |

The gain grows with the amount of overdrawn shading. The extra geometry pass hurts scenes with little overdraw or
heavy vertex shaders. On top of the 48-slice cluster grid the gain was small; the Z resolution of the clusters was
the bigger lever (see [clustered-forward.md](./clustered-forward.md)). Enable it per application and benchmark there.

## Rejected first: sorting the opaque draws front to back

A front-to-back sort of the opaque primitives was tried first. It ran into the render bundle cache: at that time,
`_isChangedSortRenderResult` did not cover the opaque order, so the bundles were not re-recorded for the new order.

Since the GPU culling work (2026-11-21), `MeshRendererComponent` compares the whole primitive order. A sort would
now be correct, but any order change triggers a bundle re-record, so a depth sort that changes whenever the camera
moves would re-record every frame. The depth prepass gets early-Z rejection without reordering.

## Related: shaders that discard

Early-Z only works when the fragment shader cannot discard. An audit on 2026-11-17 found:

- Opaque PBR has no `discard`.
- Alpha Mask and `RN_USE_WIREFRAME` add one, as expected.
- The node-based AlphaTest and Wireframe nodes emit their code only when they are in the graph.
- MToon 0.x had an unconditional `alpha < 0.01` discard. It is now gated by `RN_ALPHATEST_ON` / `RN_ALPHABLEND_ON`.

Sponza's glTF materials are alpha Mask, so they keep a discard legitimately. The audit method is in
[performance-measurement.md](./performance-measurement.md#auditing-discard).
