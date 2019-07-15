# Rhodonite

Rhodonite is a WebGL library written in TypeScript.

## Feature

* Entity Component System
* Original high speed drawing system with data texture

## Building Rhodonite

### Prerequisites

* Node.js 8.x or later
* yarn package manager

### Setup Project

```bash
$ yarn install
$ yarn setup
```

### Library build command

```bash
$ yarn build
```

## How to write the code with Rhodonite

### In Javascipt

#### For modern browsers (excludes IE11)

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


#### For All browsers which support WebGL (include IE11)

```html
<body>
  <canvas id="world"></canvas>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js"></script> <!-- only for IE11 support -- >
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script> <!-- only for IE11 support -- >
  <script src="https://cdnjs.cloudflare.com/ajax/libs/es6-promise/3.3.1/es6-promise.min.js"></script> <!-- only for IE11 support -- >
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.4/fetch.min.js"></script> <!-- only for IE11 support -- >
  <script src="../../../dist/rhodonite.min.ie11.js"></script> <!-- only for IE11 support -- >
  <script>
    // All Rhodonite classes you need are window.Rn object.
    const promises = [];
    const promise1 = Rn.ModuleManager.getInstance().loadModule('webgl');
    const promise2 = Rn.ModuleManager.getInstance().loadModule('pbr');
    promises.push(promise1);
    promises.push(promise2);
    promises.all(promises).then(function(){
      const system = Rn.System.getInstance();
      const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
      const entityRepository = Rn.EntityRepository.getInstance();
      ...
      (After that, please refer to the sample codes.)
      ...
    });
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

For build main.ts, Use the following command.

```
$ npx tsc ./main.ts --lib es2015,dom --target es5 --module umd --moduleResolution node
```

## Building API Documents

```bash
$ yarn doc
```

## Testing Rhodonite

```bash
$ yarn test
```

## Watching Test Samples

```bash
$ yarn serv
```

Then, access http://localhost:8082/ with your web browser.
