# Rhodonite

![Rhodonite](./assets/images/Rhodonite_Logo_2.png)

Rhodonite is a WebGL library written in TypeScript.

## Feature

* Entity Component System
* Blittable Memory Architecture (Original GPU data storage system with floating point texture)
* Physically based Rendering with Image Based Lighting
* Support loading the following 3D model files: [glTF2](https://github.com/KhronosGroup/glTF), glTF1, [VRM](https://vrm.dev/en/)
* Support [Basis Universal](https://github.com/BinomialLLC/basis_universal) Compressed Texture

## Viewer

You can try our library via https://editor.librn.com/ .
This viewer supports glTF/VRM files Drag & Drop to display.
(Drag & Drop all files if glTF data is consists of multiple files.)

![poly](./assets/images/screenshot_poly.webp)

## Support Browsers

Google Chrome, Firefox, Safari, Microsoft Edge (chromium-based), and other modern browsers are supported.
IE11 is not supported.

## Building Rhodonite

### Prerequisites

* Node.js 12.18.1 or later

### Setup Project

```bash
$ npm install
```

You can use yarn instead.

### Library build command

```bash
$ npm run build
```

## How to write the code with Rhodonite

### In Javascipt

```html
<body>
  <canvas id="world"></canvas>
  <script src="../../../dist/rhodonite.min.js"></script>
  <script>
  async function load() {
    // All Rhodonite classes you need are in window.Rn object.
    await Rn.ModuleManager.getInstance().loadModule('webgl');
    await Rn.ModuleManager.getInstance().loadModule('pbr');
    const system = Rn.System.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
    const entityRepository = Rn.EntityRepository.getInstance();
    ...
    (After that, please refer to the sample codes.)
    ...
  }
  </script>
</body>
```


### In TypeScript

#### HTML

```html
<body>
  <canvas id="world"></canvas>
  <script src="../../../dist/rhodonite.min.js"></script>

  <!-- Use require.js when you write your application code in typescript -->
  <script src="../../../node_modules/requirejs/require.js" data-main="./main.js"></script>
</body>
```

#### main.ts (will be compiled to main.js)

```typescript
import { RnType } from '../../../dist/types/foundation/main'
import CameraComponent from '../../../dist/types/foundation/components/CameraComponent';
// import CameraComponent from '../../../src/types/foundation/components/CameraComponent'; // Don't refer from 'src' directory
import RenderPass from '../../../dist/types/foundation/renderer/RenderPass';

declare const Rn: RnType;

async function load() {
  // All Rhodonite classes you need are in window.Rn object.
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf1Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  const entityRepository = Rn.EntityRepository.getInstance();

  // Camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent) as CameraComponent; // You don't need "Rn." for type annotation

  ...
  (After that, please refer to the sample codes.)
  ...
}
```

To build main.ts, Use the following command.

```
$ npx tsc ./main.ts --lib es2015,dom --target es5 --module umd --moduleResolution node
```

## Building API Documents

```bash
$ npm run doc
```

## Testing Rhodonite

```bash
$ npm run test
```

Some of the E2E (visual) tests might fail due to GPU environment differences.
The official test environment is our Github Action CI Runner instance.

## Trying Samples

```bash
$ npm run start
```

Then, access http://localhost:8082/ with your web browser.

# Debugging inside VSCode

1. Install the "Debugger for Chrome" VSCode Extension.
2. Start the local server with `$ npm run start`.
3. Push the run icon by choosing "Launch Chrome to debug Rhodonite samples" in the RUN tab of VSCode's left pane to start debugging.

