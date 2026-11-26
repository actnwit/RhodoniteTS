# RhodoniteTS Project Index

A map of the source tree: where each subsystem lives and where to start reading. For the reasoning behind the
recent rendering features, see [design-notes/](./design-notes/README.md).

## Architecture

| Concept | Implementation | Key files |
|---|---|---|
| Entity-Component-System | Entities with attachable components; components are processed by stage (`ProcessStage`: Load, Mount, Logic, PreRender, Render, ...) | `src/foundation/core/Entity.ts`, `Component.ts`, `ComponentRepository.ts`, `EntityRepository.ts` |
| Blittable memory | Component and material data live in pre-allocated buffers that are uploaded to the GPU as one block (a float texture on WebGL2, storage buffers on WebGPU) | `src/foundation/core/MemoryManager.ts`, `src/foundation/memory/` |
| Backend strategies | One rendering strategy per graphics API | `src/webgl/WebGLStrategyWebGL2.ts`, `src/webgpu/WebGpuStrategyBasic.ts` |
| Resource repositories | GPU resource management per API | `src/webgl/WebGLResourceRepository.ts`, `src/webgpu/WebGpuResourceRepository.ts` |
| Optional modules | Backends, PBR data, XR and Effekseer are loaded on demand | `src/foundation/system/ModuleManager.ts`, `src/pbr/`, `src/xr/`, `src/effekseer/` |

`ProcessApproach` selects the backend: `WebGL2`, `WebGPU`, or `None` (no rendering, used by unit tests).

## Where a frame goes

1. `Engine.process()` (`src/foundation/system/Engine.ts`) runs the component stages for each render pass of the
   given expressions.
2. `ForwardRenderPipeline` (`src/foundation/renderer/pipelines/ForwardRenderPipeline.ts`) builds those expressions:
   shadows, the main pass, transmission, TAA or MSAA resolve, bloom and tone mapping.
3. The backend strategy generates the shader accessors for the GPU instance data and records the draws.

## Source tree

```
src/
├── index.ts, import.ts       # Package entry points (named exports + default `Rn` namespace)
├── iife.ts                   # Entry of the IIFE bundles
├── backendFlags.d.ts         # __RN_WEBGL__ / __RN_WEBGPU__ bundler flags
├── foundation/
│   ├── core/                 # Entity, Component, repositories, Config, MemoryManager, ComponentRuntimeHooks
│   ├── components/           # Animation, AnimationState, BlendShape, Camera, CameraController,
│   │                         # CharacterController, Constraint, Light, Mesh, MeshRenderer, Physics,
│   │                         # Raymarching, SceneGraph, Shape, Skeletal, Transform, Trigger, Vrm
│   ├── system/               # Engine, ModuleManager, InputManager, EventPubSub
│   ├── renderer/             # RenderPass, Expression, Frame, FrameBuffer
│   │   ├── pipelines/        # ForwardRenderPipeline, DeferredRenderPipeline
│   │   ├── lightCluster/     # Clustered Forward (CPU builder, layout, lazy-loaded system)
│   │   └── TemporalAA/       # TAA system, previous-frame data tracking
│   ├── materials/
│   │   ├── core/             # Material, MaterialRepository, ShaderGraphResolver, DummyTextures, ...
│   │   ├── contents/         # Material contents (Custom, MToon0x/1, MatCap, depth/shadow helpers, ...)
│   │   └── nodes/            # Shader nodes of the node-based material system
│   ├── helpers/              # MeshHelper, MaterialHelper, EntityHelper, RenderableHelper, AssetLoader,
│   │   ├── materials/        # One factory per material (createPbrUberMaterial, ...), optionalMaterials.ts
│   │   └── Shadow/           # ShadowSystem
│   ├── geometry/             # Primitive, Mesh, shapes/ (Plane, Cube, Sphere, ...)
│   ├── math/                 # Vector*, Matrix*, Quaternion (immutable + Mutable*), ColorRgb(a), AABB, Animated*
│   ├── importer/             # GltfImporter, Gltf2Importer, ModelConverter, VRM/VRMA, Draco, KHR_physics
│   ├── exporter/             # Gltf2Exporter
│   ├── textures/             # Texture, CubeTexture, RenderTargetTexture(2DArray/Cube), VideoTexture, Sampler
│   ├── cameras/              # Orbit and walk-through camera controllers
│   ├── physics/              # PhysicsBackend registry, Rapier strategy, VRM spring bones
│   ├── gizmos/               # Gizmos (registered on demand by registerGizmos())
│   ├── constraints/          # VRM constraints
│   ├── definitions/          # Enums (ProcessApproach, ComponentType, ShaderSemantics, ...)
│   ├── memory/, misc/, enhanced_js_objects/
├── webgl/                    # WebGL2 backend: strategy, resource repository, multi-draw, GLSL shaders,
│                             # textureLoader/ (KTX2)
├── webgpu/                   # WebGPU backend: strategy, resource repository, GPU culling, compute skinning,
│                             # light cluster builder, buffer arena, WGSL shaders
├── xr/                       # WebXR / WebAR (loaded on demand)
├── effekseer/                # Effekseer integration
├── pbr/                      # PBR lookup data, loaded on demand
└── types/                    # Type definitions (glTF, VRM, ...)
```

## Materials

All built-in materials are created by factories in `src/foundation/helpers/materials/`:

- PBR: `createPbrUberMaterial`. Classic (Lambert/Blinn-Phong): `createClassicUberMaterial`. `createMatCapMaterial`,
  `createFlatMaterial`.
- Post effects and helpers: tone mapping, FXAA, Gaussian blur, depth encoding, shadow-map decoding, motion
  vectors and TAA resolve, IBL prefiltering, ...
- Node-based (`createNodeBasedCustomMaterial`), node-based raymarching and MToon live in `optionalMaterials.ts` and are
  exported from the `rhodonite/optional-materials` subpath.

A node graph (the Rete-style JSON of RhodoniteEditor2) is resolved into GLSL/WGSL by
`src/foundation/materials/core/ShaderGraphResolver.ts` from the nodes in `src/foundation/materials/nodes/`.
Shader sources live in `src/webgl/shaderity_shaders/` and `src/webgpu/shaderity_shaders/` (read CLAUDE.md's
"Shader Sources" rules before editing them).

## Rendering features

| Feature | Code | Note |
|---|---|---|
| Clustered Forward | `renderer/lightCluster/`, `webgpu/WebGpuLightClusterBuilder.ts` | [clustered-forward.md](./design-notes/clustered-forward.md) |
| Shadows (VSM) | `helpers/Shadow/ShadowSystem.ts` | [shadows.md](./design-notes/shadows.md) |
| WebGL2 multi-draw | `webgl/MultiDraw.ts` | [webgl-multidraw.md](./design-notes/webgl-multidraw.md) |
| WebGPU GPU culling and compute skinning | `webgpu/WebGpuGpuCulling.ts`, `webgpu/WebGpuVertexDeformer.ts` | [webgpu-gpu-culling.md](./design-notes/webgpu-gpu-culling.md) |
| WebGPU depth prepass | `webgpu/WebGpuStrategyBasic.ts` | [webgpu-depth-prepass.md](./design-notes/webgpu-depth-prepass.md) |
| Temporal AA | `renderer/TemporalAA/` | [temporal-aa.md](./design-notes/temporal-aa.md) |
| Raymarching (SDF) | `components/Raymarching/`, `helpers/materials/createNodeBasedRaymarchingMaterials.ts` | [RHODONITE_raymarching_extensions.md](./RHODONITE_raymarching_extensions.md) |

## Build outputs

```
dist/
├── esm/        # Production ES modules, one file per source module (+ _deps/ for npm/vendor code)
├── esmdev/     # Same, unminified with inline source maps
├── iife/       # rhodonite.min.js, a single browser bundle (global `Rn`)
└── iifedev/    # rhodonite.js, unminified with inline source maps
```

`dist/` is tracked in git. Distribution updates usually go in their own commit.

## Tests and samples

- Unit tests: `*.test.ts` next to the source (Vitest + happy-dom, `config/test/vitest.config.ts`).
- E2E visual tests: `samples/test_e2e/<Sample>/` (Puppeteer, `config/test/vitest.config.e2e.ts`). Each sample is also a
  runnable usage example: `pnpm start`, then open `http://localhost:8082/samples/test_e2e/<Sample>/`.
- Other samples: `samples/simple/`.

## Related documents

- [README](../README.md): installation, usage, building and testing
- [API Overview](./API_OVERVIEW.md): a tour of the public API
- [Developer Workflow](./DEVELOPER_WORKFLOW.md): day-to-day development
- [CLAUDE.md](../CLAUDE.md): coding rules (tree shaking, shaders, tests)
- [Generated API docs](./api/): TypeDoc output (`pnpm doc`)
