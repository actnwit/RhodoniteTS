# RhodoniteTS API Overview

A short tour of the public API. Every example below follows code that exists in `samples/`; when in doubt, the
samples and the generated [TypeDoc](./api/) are the reference. All examples use the default `Rn` namespace. With
named imports (`import { Engine, ... } from 'rhodonite'`), the names are the same; see the README's
"Tree shaking" section for what changes.

> Most APIs take the `engine` instance as their first argument. Several engines can live in one page, so there are
> no global singletons to initialize.

## Engine

```typescript
import Rn from 'rhodonite';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.WebGL2, // or Rn.ProcessApproach.WebGPU
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ logLevel: Rn.LogLevel.Info }), // optional
  // webglOption: { ... },  // WebGLContextAttributes (WebGL2 only)
  // xr: true,              // load the WebXR/WebAR support (default: true with the `Rn` default export)
});
```

| Member | Purpose |
|---|---|
| `engine.startRenderLoop(fn)` / `stopRenderLoop()` | Run `fn` every animation frame |
| `engine.process(expressions)` / `engine.process(frame)` | Render one frame from `Expression`s, or from a `Frame` given by `ForwardRenderPipeline` |
| `engine.processAuto()` | Render every entity with the current camera; for quick tests |
| `engine.resizeCanvas(w, h)` | Resize the canvas and the backbuffer |
| `engine.entityRepository`, `engine.componentRepository`, `engine.materialRepository` | Per-engine repositories |
| `engine.config` | The `Config` the engine was created with |
| `engine.gpuTimerEnabled`, `engine.gpuTimeMilliseconds`, `engine.gpuPassTimesMilliseconds` | GPU timing (see [design-notes/performance-measurement.md](./design-notes/performance-measurement.md)) |
| `await engine.enableXR()` | Load the XR support after init |
| `engine.destroy()` | Release the engine |

### Config

`Config` holds the engine-wide settings. Pass it at init; most fields are read every frame. Rendering feature
switches:

| Field | Default | Note |
|---|---|---|
| `isClusteredForwardEnabled`, `clusteredForward*` | `true` | [Clustered Forward](./design-notes/clustered-forward.md) |
| `lightAutoRangeThreshold`, `lightRangeScale` | `0`, `1` | Let range-less lights be culled / trade reach for speed |
| `maxLightNumber` | `6` | Lights that can cast shadows at the same time (0 disables shadow slots) |
| `isMultiDrawEnabled` | `true` | WebGL2 [multi-draw](./design-notes/webgl-multidraw.md) |
| `isGpuCullingEnabled`, `isComputeSkinningEnabled` | `true` | WebGPU [GPU culling](./design-notes/webgpu-gpu-culling.md) |
| `isDepthPrepassEnabled` | `false` | WebGPU [depth prepass](./design-notes/webgpu-depth-prepass.md) |
| `cacheWebGpuRenderBundles` | `true` | WebGPU render bundle caching |
| `logLevel`, `cgApiDebugConsoleOutput` | `Warn`, `false` | Logging |

The doc comment of each field in `src/foundation/core/Config.ts` explains its trade-offs.

## Entities and components

Entities are created by helper functions; each one adds the components it needs.

```typescript
const group = Rn.createGroupEntity(engine);          // Transform + SceneGraph
const meshEntity = Rn.createMeshEntity(engine);       // + Mesh + MeshRenderer
const light = Rn.createLightEntity(engine);           // + Light
const camera = Rn.createCameraEntity(engine, true);   // + Camera (true: make it the current camera)
const controlled = Rn.createCameraControllerEntity(engine, true); // + CameraController (mouse/touch control)

group.addChild(meshEntity.getSceneGraph());

meshEntity.localPosition = Rn.Vector3.fromCopy3(1, 2, 3);
meshEntity.localEulerAngles = Rn.Vector3.fromCopy3(0, Math.PI, 0);
meshEntity.localScale = Rn.Vector3.fromCopy3(2, 2, 2);
```

Other helpers: `createLightWithCameraEntity` (a light with a synchronized camera, for shadows),
`createTransformEntity`, `createSkeletalEntity`, `createPhysicsEntity`, `createShapeEntity`,
`createRaymarchingEntity`, `createCharacterControllerEntity`.

To add a component to an existing entity, pass the class (or, for the core components, the TID):

```typescript
const withLight = engine.entityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  meshEntity
);
```

Component classes are registered when they are first added to an entity. `tryToAddComponentToEntityByTID` finds only
the core classes (Transform, SceneGraph, Mesh, MeshRenderer, Camera, CameraController, Light, Animation) and classes
added before; use `engine.entityRepository.addComponentToEntity(ComponentClass, entity)` for the others.

## Meshes and materials

```typescript
const material = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true, isShadow: true });
material.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.9, 0.3, 0.2, 1));
material.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(1.0, 0.15));

const plane = Rn.MeshHelper.createPlane(engine, { width: 12, height: 12, uSpan: 1, vSpan: 1, material });
const cube = Rn.MeshHelper.createCube(engine, { widthVector: Rn.Vector3.fromCopy3(0.5, 0.5, 0.5), material });
const sphere = Rn.MeshHelper.createSphere(engine, { radius: 0.6, widthSegments: 32, heightSegments: 24, material });
```

- Material factories also exist as named exports (`createPbrUberMaterial`, `createClassicUberMaterial`,
  `createMatCapMaterial`, ... in `src/foundation/helpers/materials/`). Prefer them in applications that care about
  bundle size: the `MaterialHelper` object references every material.
- Node-based materials, raymarching materials and MToon come from the `rhodonite/optional-materials` subpath
  (`createNodeBasedCustomMaterial`, `createMToon0xMaterial`, `createMToon1Material`, ...).
- For hand-written shaders, see `samples/test_e2e/CustomShader` (it has its own README).

## Rendering

### Expressions and render passes

```typescript
const renderPass = new Rn.RenderPass(engine);
renderPass.cameraComponent = camera.getCamera();
renderPass.clearColor = Rn.Vector4.fromCopy4(0.05, 0.06, 0.08, 1);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([plane, cube, sphere]);

const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

engine.startRenderLoop(() => {
  engine.process([expression]);
});
```

Render targets are created with `Rn.RenderableHelper.createFrameBuffer(engine, { ... })` and set with
`renderPass.setFramebuffer(frameBuffer)`.

### ForwardRenderPipeline

`ForwardRenderPipeline` builds the usual passes around your expressions: shadows, MSAA or TAA, transmission,
bloom, IBL and tone mapping.

```typescript
const pipeline = new Rn.ForwardRenderPipeline(engine);
await pipeline.setup(canvas.width, canvas.height, {
  isShadow: true,      // shadow maps for lights with castShadow
  isBloom: false,
  shadowMapSize: 1024,
  isSimple: false,     // true: no post effects
  isTemporalAA: false, // true: TAA instead of 4x MSAA (see design-notes/temporal-aa.md)
});
pipeline.setExpressions([expression]);

const diffuse = await Rn.CubeTexture.loadFromUrl(engine, {
  baseUrl: './assets/ibl/papermill/diffuse/diffuse',
  mipmapLevelNumber: 1,
  isNamePosNeg: true,
  hdriFormat: Rn.HdriFormat.RGBE_PNG,
});
// ... load `specular` the same way (with its mip count) ...
pipeline.setIBLTextures(diffuse, specular);

pipeline.startRenderLoop(frame => {
  engine.process(frame);
});
```

Other members: `resize(w, h)`, `setToneMappingType(type)`, `setDiffuseIBLContribution(v)`,
`setSpecularIBLContribution(v)`, `setIBLRotation(radian)`, `resetTemporalAAHistory()`.

### Lights and shadows without the pipeline

```typescript
const sun = Rn.createLightWithCameraEntity(engine);
sun.getLight().type = Rn.LightType.Directional;
sun.getLight().intensity = 2.5;
sun.getLight().castShadow = true;

const point = Rn.createLightEntity(engine);
point.getLight().type = Rn.LightType.Point;
point.getLight().range = 2; // a range lets Clustered Forward cull the light

const shadowSystem = new Rn.ShadowSystem(engine, 1024);
const shadowExpressions = shadowSystem.getExpressions(entities);
engine.startRenderLoop(() => {
  shadowSystem.setDepthBiasPV(entities);
  engine.process([...shadowExpressions, expression]);
});
```

## Loading assets

```typescript
// glTF / GLB / VRM (format detected automatically). Returns an Expression.
const modelExpression = await Rn.GltfImporter.importFromUrl(engine, './model.glb', {
  cameraComponent: camera.getCamera(),
});

// Textures
const texture = await Rn.Texture.loadFromUrl(engine, './albedo.png');
```

`Rn.Gltf2Importer.importFromUrl(url)` returns the parsed glTF (`RnM2`) without creating entities;
`Rn.ModelConverter.convertToRhodoniteObject(engine, gltfModel)` converts it. `Rn.VrmaImporter` loads VRMA
animations. To load many promises with a concurrency limit, timeouts and retries, see [AssetLoader.md](./AssetLoader.md).

## Animation

```typescript
Rn.AnimationComponent.setActiveAnimationForAll(engine, trackName); // choose the track of every animated entity
Rn.AnimationComponent.setGlobalTime(engine, seconds);               // drive the time yourself
entity.tryToGetAnimation()?.setIsAnimating(false);                  // pause one entity
```

Blend shape weights: `entity.tryToGetBlendShape()?.setWeightByIndex(0, 0.5)` or `.weights = [...]`.

## Math

Immutable classes (`Vector3`, `Matrix44`, `Quaternion`, ...) have static operations that return new objects, and
`To` variants that write into a mutable output. Mutable classes (`MutableVector3`, ...) also have in-place instance
methods.

```typescript
const a = Rn.Vector3.fromCopy3(1, 2, 3);
const b = Rn.Vector3.fromCopy3(4, 5, 6);
const sum = Rn.Vector3.add(a, b);
const dot = a.dot(b);
const cross = Rn.Vector3.cross(a, b);
const unit = Rn.Vector3.normalize(a);

const m = Rn.MutableVector3.fromCopy3(1, 2, 3);
m.add(b); // in place

const q = Rn.Quaternion.fromAxisAngle(Rn.Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
const rotated = q.transformVector3(a);
const mid = Rn.Quaternion.qlerp(q, Rn.Quaternion.identity(), 0.5);

const t = Rn.Matrix44.translate(Rn.Vector3.fromCopy3(1, 2, 3));
const r = Rn.Matrix44.rotateY(Math.PI / 4);
const tr = Rn.Matrix44.multiply(t, r);
```

## Errors

Some APIs return `Result<T, E>` (`Ok` / `Err` in `src/foundation/misc/Result.ts`): check `isOk()`, then `get()`, or
`getRnError()` on failure. Errors thrown by the engine are `RnException` instances.

## WebXR

With the default `Rn` export, or `Engine.init({ xr: true })`, or after `await engine.enableXR()`, the XR systems are
available as `engine.webXRSystem` and `engine.webARSystem` (`src/xr/WebXRSystem.ts`, `src/xr/WebARSystem.ts`).
Without XR support, reading `engine.webXRSystem` throws an error that says how to enable it.
