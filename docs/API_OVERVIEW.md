# RhodoniteTS API Overview

**Comprehensive API Reference and Usage Patterns**

> 🎯 **Quick Navigation**: [System](#system-api) | [ECS](#entity-component-system) | [Math](#mathematical-apis) | [Rendering](#rendering-apis) | [Assets](#asset-apis) | [Materials](#material-apis)

---

## 🔧 System API

### System Initialization

```typescript
import Rn from 'rhodonite';

// Basic initialization
await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
});

// Advanced initialization with WebGPU
await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: canvas,
  webgpuOptions: {
    requiredFeatures: ['texture-compression-bc'],
  },
});
```

### Core System Methods

| Method | Purpose | Usage |
|--------|---------|-------|
| `System.init()` | Initialize Rhodonite | Required before any operations |
| `System.startRenderLoop()` | Begin rendering | Pass render function |
| `System.processAuto()` | Automatic processing | Call in render loop |
| `System.process()` | Manual processing | For custom control |

---

## 🏗️ Entity-Component-System

### Entity Management

```typescript
// Create entities
const entity = Rn.EntityRepository.createEntity();
const meshEntity = Rn.MeshHelper.createPlane(); // Helper with components

// Entity hierarchy
const parent = Rn.EntityRepository.createEntity();
const child = Rn.EntityRepository.createEntity();
parent.getSceneGraph().addChild(child.getSceneGraph());
```

### Component System

#### Core Components

```typescript
// Transform Component
const transform = entity.getTransform();
transform.localPosition = Rn.Vector3.fromCopy3(1, 2, 3);
transform.localEulerAngles = Rn.Vector3.fromCopy3(0, Math.PI, 0);
transform.localScale = Rn.Vector3.fromCopy3(2, 2, 2);

// Mesh Component
const mesh = entity.getMesh();
mesh.setMesh(primitive);

// Camera Component
const camera = entity.getCamera();
camera.type = Rn.CameraType.Perspective;
camera.fovy = Math.PI / 4;
camera.aspect = canvas.width / canvas.height;
camera.zNear = 0.1;
camera.zFar = 1000.0;
```

#### Component Registration

```typescript
// Custom component registration
class CustomComponent extends Rn.Component {
  constructor(entityUid: number, componentSid: number, entityRepository: Rn.EntityRepository) {
    super(entityUid, componentSid, entityRepository);
  }

  // Implement required methods
  $load(): void { /* ... */ }
  $logic(): void { /* ... */ }
}

// Register component type
Rn.ComponentRepository.registerComponentClass(CustomComponent);
```

---

## 🧮 Mathematical APIs

### Vector Operations

```typescript
// Vector3 - Immutable
const v1 = Rn.Vector3.fromCopy3(1, 2, 3);
const v2 = Rn.Vector3.fromCopy3(4, 5, 6);
const result = v1.add(v2); // Returns new Vector3

// MutableVector3 - Mutable
const mv = Rn.MutableVector3.fromCopy3(1, 2, 3);
mv.addSelf(v2); // Modifies mv directly

// Common operations
const length = v1.length();
const normalized = v1.normalize();
const dot = v1.dot(v2);
const cross = v1.cross(v2);
```

### Matrix Operations

```typescript
// Matrix44 creation
const identity = Rn.Matrix44.identity();
const translation = Rn.Matrix44.translate(Rn.Vector3.fromCopy3(1, 2, 3));
const rotation = Rn.Matrix44.rotateY(Math.PI / 4);
const scale = Rn.Matrix44.scale(Rn.Vector3.fromCopy3(2, 2, 2));

// Matrix composition
const transform = translation.multiply(rotation).multiply(scale);

// View and projection matrices
const view = Rn.Matrix44.lookAt(
  Rn.Vector3.fromCopy3(0, 0, 5), // eye
  Rn.Vector3.fromCopy3(0, 0, 0), // target
  Rn.Vector3.fromCopy3(0, 1, 0)  // up
);

const projection = Rn.Matrix44.perspective(
  Math.PI / 4, // fovy
  aspect,      // aspect ratio
  0.1,         // near
  1000.0       // far
);
```

### Quaternion Operations

```typescript
// Quaternion creation
const q1 = Rn.Quaternion.fromAxisAngle(Rn.Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
const q2 = Rn.Quaternion.fromEulerAngles(Rn.Vector3.fromCopy3(0, Math.PI / 4, 0));

// Quaternion operations
const combined = Rn.Quaternion.multiply(q1, q2);
const interpolated = Rn.Quaternion.qlerp(q1, q2, 0.5);

// Vector transformation
const vector = Rn.Vector3.fromCopy3(1, 0, 0);
const rotated = q1.transformVector3(vector);
```

---

## 🎨 Rendering APIs

### Render Pipeline

```typescript
// Create render pass
const renderPass = new Rn.RenderPass();
renderPass.cameraComponent = cameraEntity.getCamera();
renderPass.clearColor = Rn.Vector4.fromCopy4(0.2, 0.2, 0.2, 1.0);
renderPass.clearDepth = 1.0;

// Add entities to render
renderPass.addEntities([meshEntity1, meshEntity2]);

// Execute render pass
Rn.Engine.process([renderPass]);
```

### Frame Buffer Management

```typescript
// Create render target
const frameBuffer = Rn.RenderableHelper.createFrameBuffer({
  width: 1024,
  height: 1024,
  textureNum: 1,
  colorAttachmentFormats: [Rn.TextureFormat.RGBA8],
  depthAttachmentFormat: Rn.TextureFormat.Depth32F,
});

// Use as render target
renderPass.setFramebuffer(frameBuffer);
```

### Multi-API Support

```typescript
// Check API availability
const isWebGPUSupported = Rn.Config.cgApiDebugMode === 'webgpu';
const isWebGL2Supported = Rn.Config.cgApiDebugMode === 'webgl2';

// API-specific configuration
if (isWebGPUSupported) {
  // WebGPU-specific setup
  await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: canvas,
    webgpuOptions: { /* WebGPU options */ }
  });
} else {
  // WebGL2 fallback
  await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: canvas,
  });
}
```

---

## 📦 Asset APIs

### glTF/VRM Loading

```typescript
// Load glTF file
const gltfImporter = Rn.GltfImporter.getInstance();
const expression = await gltfImporter.import('path/to/model.gltf', {
  files: files, // FileList from drag & drop
  cameraComponent: cameraEntity.getCamera(),
  defaultMaterialHelperArgumentArray: [{
    makeOutputSrgb: false,
  }],
});

// Load VRM file
const vrmImporter = Rn.VrmImporter.getInstance();
const vrmExpression = await vrmImporter.import('path/to/avatar.vrm', {
  files: files,
  cameraComponent: cameraEntity.getCamera(),
});
```

### Texture Loading

```typescript
// Load texture from URL
const texture = await Rn.TextureLoader.loadTexture('path/to/texture.jpg');

// Load KTX2 compressed texture
const ktx2Texture = await Rn.KTX2TextureLoader.loadTexture('path/to/texture.ktx2');

// Create texture from ImageData
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d')!;
// ... draw to canvas
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const texture = Rn.TextureHelper.createTextureFromImageData(imageData);
```

### Asset Management

```typescript
// Asset loader with extension detection
const assetLoader = Rn.AssetLoader.getInstance();
assetLoader.loadAsset('path/to/asset.gltf', {
  // Loader options
}).then((asset) => {
  // Handle loaded asset
});

// Memory management
Rn.MemoryManager.freeMemoryIfNoEntity(); // Cleanup unused resources
```

---

## 🎭 Material APIs

### PBR Materials

```typescript
// Create PBR material
const material = Rn.MaterialHelper.createPbrUberMaterial();

// Set PBR properties
material.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(1, 0, 0, 1));
material.setParameter('metallicFactor', 0.0);
material.setParameter('roughnessFactor', 0.5);

// Set textures
material.setTextureParameter('baseColorTexture', baseColorTexture);
material.setTextureParameter('normalTexture', normalTexture);
material.setTextureParameter('metallicRoughnessTexture', mrTexture);
```

### Custom Materials

```typescript
// Create custom material content
class CustomMaterialContent extends Rn.AbstractMaterialContent {
  constructor(materialTypeName: string) {
    super(null, materialTypeName, {}, '');
  }

  // Implement vertex shader
  _getVertexShaderMethodDefinitions() {
    return `
      vec4 getWorldPosition(vec3 position_inLocal) {
        return worldMatrix * vec4(position_inLocal, 1.0);
      }
    `;
  }

  // Implement fragment shader
  _getPixelShaderMethodDefinitions() {
    return `
      vec4 getBaseColor() {
        return vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;
  }
}

// Register and use custom material
Rn.MaterialRepository.registerMaterial('CustomMaterial', CustomMaterialContent);
const customMaterial = Rn.MaterialHelper.createMaterial('CustomMaterial');
```

### Shader Nodes

```typescript
// Create shader node material
const material = Rn.MaterialHelper.createShaderGraphMaterial();

// Add shader nodes
const baseColorNode = new Rn.ConstantVector4VariableShaderNode('baseColor');
const normalNode = new Rn.AttributeNormalShaderNode();
const outputNode = new Rn.OutColorShaderNode();

// Connect nodes
material.addShaderNode(baseColorNode);
material.addShaderNode(normalNode);
material.addShaderNode(outputNode);

// Define connections
material.connectShaderNodes(baseColorNode, 'output', outputNode, 'color');
```

---

## 🎮 Animation APIs

### Keyframe Animation

```typescript
// Get animation component
const animationComponent = entity.getAnimation();

// Load animation from glTF
const animationImporter = new Rn.AnimationImporter();
const animations = await animationImporter.import(gltfAsset);

// Play animation
animationComponent.setAnimation(animations[0]);
animationComponent.play();

// Animation control
animationComponent.setPlaybackRate(2.0); // 2x speed
animationComponent.setCurrentTime(5.0);  // Seek to 5 seconds
animationComponent.pause();
animationComponent.resume();
```

### Skeletal Animation

```typescript
// Skeletal component for bone animation
const skeletalComponent = entity.getSkeletal();

// Set up bone hierarchy
const rootJoint = new Rn.Joint();
rootJoint.setRestPose(restPoseMatrix);
skeletalComponent.setJoints([rootJoint, ...childJoints]);

// Bind to mesh
const meshComponent = entity.getMesh();
meshComponent.setJoints(skeletalComponent.joints);
```

### Blend Shapes (Morph Targets)

```typescript
// Blend shape component for morph targets
const blendShapeComponent = entity.getBlendShape();

// Set morph weights
blendShapeComponent.setWeight(0, 0.5); // 50% weight for first target
blendShapeComponent.setWeight(1, 0.3); // 30% weight for second target

// Animate weights over time
const startWeight = 0.0;
const endWeight = 1.0;
const duration = 2.0; // seconds
// Use animation system or manual interpolation
```

---

## 🔧 Helper Functions

### Mesh Helpers

```typescript
// Create primitive meshes
const planeEntity = Rn.MeshHelper.createPlane();
const cubeEntity = Rn.MeshHelper.createCube();
const sphereEntity = Rn.MeshHelper.createSphere();

// Create mesh with custom geometry
const primitive = new Rn.Primitive();
primitive.setIndicesAccessor(indicesAccessor);
primitive.setAttribute('POSITION', positionAccessor);
primitive.setAttribute('NORMAL', normalAccessor);
primitive.setAttribute('TEXCOORD_0', texCoordAccessor);

const meshEntity = Rn.MeshHelper.createMeshEntity();
meshEntity.getMesh().setMesh(primitive);
```

### Camera Helpers

```typescript
// Create camera entity with controller
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraController = cameraEntity.getCameraController();

// Orbit controller
cameraController.setControllerType(Rn.CameraControllerType.Orbit);
cameraController.dolly = 10.0;
cameraController.setTarget(Rn.Vector3.fromCopy3(0, 0, 0));

// Walk-through controller
cameraController.setControllerType(Rn.CameraControllerType.WalkThrough);
cameraController.setWalkThrough(Rn.Vector3.fromCopy3(0, 0, 5));
```

### Light Helpers

```typescript
// Create directional light
const lightEntity = Rn.LightHelper.createDirectionalLight();
const light = lightEntity.getLight();
light.intensity = 2.0;
light.color = Rn.Vector3.fromCopy3(1, 1, 1);

// Create point light
const pointLightEntity = Rn.LightHelper.createPointLight();
pointLightEntity.getTransform().localPosition = Rn.Vector3.fromCopy3(0, 5, 0);

// Create spot light
const spotLightEntity = Rn.LightHelper.createSpotLight();
const spotLight = spotLightEntity.getLight();
spotLight.outerConeAngle = Math.PI / 4;
spotLight.innerConeAngle = Math.PI / 6;
```

---

## 🚨 Error Handling

### Result Pattern

```typescript
import { Result, Ok, Err } from 'rhodonite';

// Functions return Result<T, Error>
const result = Rn.SomeAPI.tryOperation();

if (result.isOk()) {
  const value = result.get(); // Success value
  // Handle success
} else {
  const error = result.getErr(); // Error information
  console.error('Operation failed:', error.message);
}

// Chain operations
const finalResult = result
  .andThen(value => Rn.AnotherAPI.processValue(value))
  .andThen(processed => Rn.YetAnotherAPI.finalStep(processed));
```

### Exception Handling

```typescript
try {
  await Rn.Engine.init(config);
} catch (error) {
  if (error instanceof Rn.RnException) {
    console.error('Rhodonite error:', error.message);
    console.error('Error code:', error.error);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 🔍 Debugging & Performance

### Debug Information

```typescript
// Enable debug mode
Rn.Config.cgApiDebugMode = 'webgl2'; // or 'webgpu'
Rn.Config.isDebugMode = true;

// Memory usage
const memoryInfo = Rn.MemoryManager.getMemoryInfo();
console.log('Memory usage:', memoryInfo);

// Performance monitoring
const stats = Rn.Engine.getPerformanceStats();
console.log('Frame time:', stats.frameTime);
console.log('Draw calls:', stats.drawCalls);
```

### Memory Management

```typescript
// Manual memory cleanup
entity.tryToDestroy(); // Destroy entity and components
Rn.MaterialRepository.destroyMaterial(material);
Rn.TextureRepository.destroyTexture(texture);

// Automatic cleanup
Rn.MemoryManager.freeMemoryIfNoEntity();
```

---

## 📱 WebXR Integration

### VR Setup

```typescript
// Initialize WebXR
const webXRSystem = Rn.WebXRSystem.getInstance();
await webXRSystem.setupWebXRSession({
  sessionMode: 'immersive-vr',
  canvas: canvas,
});

// XR render loop
webXRSystem.startRenderLoop(() => {
  // XR-specific rendering
  Rn.Engine.processAuto();
});
```

---

**Last Updated**: Generated by /sc:index | **Version**: 0.17.4 | **TypeScript**: ES2019+ | **APIs**: WebGL2 + WebGPU
