# WebGPU/Metal: uniform u32 division corrupts implicit texture LOD with 4x MSAA

## Description

Chrome on macOS selects the wrong texture mip level along internal triangle edges when
all of the following are combined:

- A uniform `u32` is divided in the fragment shader.
- The result is converted to `f32` and added to interpolated UV coordinates.
- A two-level texture is sampled with `textureSample()` (implicit LOD).
- The render pipeline uses 4x MSAA.

The uniform value is zero, so the computed UV offset is also zero and the UV coordinates
are unchanged. Nevertheless, black LOD 1 leaks into the white LOD 0 result along every
triangle edge.

## Steps to reproduce

1. Serve the attached `index.html` and `main.js` over localhost.
2. Open the page in Chrome on macOS with WebGPU enabled.
3. Compare the three canvases:
   - 4x MSAA + `textureSample()`
   - 4x MSAA + `textureSampleLevel(..., 0.0)`
   - 1x + `textureSample()`

## Expected result

All three canvases show a uniformly white rectangle.

## Actual result

The 4x MSAA + `textureSample()` canvas shows black diagonal lines at internal triangle
edges. Although every frame redraws identical static inputs, these lines also flicker
and are not temporally stable. The 4x explicit-LOD and 1x implicit-LOD controls remain
uniformly white and stable.

## Environment

- Chrome version: 149.0.0.0
- macOS version: <!-- fill from System Settings; the frozen UA value is not reliable -->
- Hardware model: <!-- fill -->
- WebGPU adapter: apple / metal-3 / unknown
- Reproduces in Chrome/macOS: yes
- Reproduces in Safari/macOS: no
- Reproduces in Firefox/macOS: no
- Reproduces in Chrome/Windows: no
- WebGPU validation errors: none

## Reduced shader

```wgsl
@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
  let offset = f32(drawParameters.materialSid / 2u); // materialSid == 0
  let uv = input.uv + vec2f(offset);
  return textureSample(baseTexture, baseSampler, uv);
}
```

## Controls and reduction findings

- Replacing `textureSample()` with `textureSampleLevel(..., 0.0)` fixes the output.
- Changing only `multisample.count` from 4 to 1 fixes the output.
- Replacing `/ 2u` with the equivalent `>> 1u` fixes the output.
- Removing the uniform-derived zero offset fixes the output.
- Using a texture with only one mip level fixes the output.
- Perspective interpolation, depth, storage buffers, multiple bind groups, multiple
  render passes, and a post-process pass are not required.
- The final reproduction uses one bind group, one render pass, no depth buffer, and a
  direct MSAA resolve to the canvas texture.

This was originally observed in Rhodonite's MToon renderer, but the attached
reproduction uses only browser WebGPU APIs and generated data.
