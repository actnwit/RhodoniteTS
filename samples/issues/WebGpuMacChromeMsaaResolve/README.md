# WebGPU macOS Chrome uniform-division derivative artifact

This dependency-free WebGPU reproduction demonstrates incorrect implicit texture LOD
near internal triangle edges in Chrome on macOS.

## Run

From the RhodoniteTS repository root:

```bash
pnpm start
```

Open:

```text
http://localhost:8082/samples/issues/WebGpuMacChromeMsaaResolve/
```

## Minimal trigger

The fragment shader derives a zero UV offset from a uniform `u32`:

```wgsl
let offset = f32(drawParameters.materialSid / 2u); // materialSid is 0
let uv = input.uv + vec2f(offset);                  // uv is unchanged
let color = textureSample(texture, sampler, uv);   // implicit LOD
```

The texture has two solid mip levels: LOD 0 is white and LOD 1 is black. With 4x MSAA,
black LOD 1 leaks along every internal triangle edge. WebGPU validation reports no
errors. The inputs are static and identical every frame, but the diagonal artifacts may
also flicker from frame to frame.

## Controls

- 4x MSAA + `textureSampleLevel(..., 0.0)` is uniformly white.
- 1x + `textureSample()` is uniformly white; it still uses implicit LOD.

The artifact also disappears when `/ 2u` is replaced by the equivalent `>> 1u`, when
the uniform-derived offset is removed, or when the texture has only one mip level.
