# Rhodonite

![Rhodonite](./assets/images/Rhodonite_Logo_2.png)

Rhodonite is a WebGL library written in TypeScript.

![npm](https://img.shields.io/npm/v/rhodonite)
![license](https://img.shields.io/npm/l/rhodonite)

## Feature

* Entity Component System
* Blittable Memory Architecture (Original GPU data storage system with floating point texture)
* Physically based Rendering with Image Based Lighting
* Support loading the following 3D model files: [glTF2](https://github.com/KhronosGroup/glTF), glTF1, [VRM](https://vrm.dev/en/)
* Support [Draco compression](https://google.github.io/draco/), [Basis Universal](https://github.com/BinomialLLC/basis_universal) and [KTX2](http://github.khronos.org/KTX-Specification/), etc

## What's the "Blittable Memory Architecture"


With the Blittable Memory Architecture, Rhodonite stores almost all of its data in a large pre-allocated ArrayBuffer. Data storage for matrix or vector classes in Rhodonite's component classes and materials are assigned from the memory pool, which means most of the data are on that memory pool, transferred to the GPU every frame as a floating-point texture.
This architecture allows all shaders always to access a vast amount of data.

For example, Rhodonite can handle and blend all morph targets (38 targets) of VRM characters simultaneously in the shader.

## Viewer

You can try our library via https://editor.librn.com/ .
This viewer supports glTF/VRM files Drag & Drop to display.
(Drag & Drop all files if glTF data is consists of multiple files.)

![poly](./assets/images/screenshot_poly.webp)

## Supported Browsers

Google Chrome, Firefox, Safari, Microsoft Edge (chromium-based), and other modern browsers are supported.
IE11 is not supported.

## Install

You can install the esm version of Rhodonite easily.

```bash
$ yarn add rhodonite
```

You can install yarn as following,

```bash
$ npm install -g yarn
```

You can use npm of course, but we recommend yarn because we use it usually.

```bash
$ npm install rhodonite
```

### Note

If you get an error like "webxr-input-profiles not found" when building a project using Rhodonite, Try "npm install" or "yarn install again.

## Coding with Rhodonite

### In JavaScript

```html
<body>
  <canvas id="world"></canvas>
  <script src="../../../dist/umd/rhodonite.min.js"></script>
  <script>
  async function load() {
    // All Rhodonite classes you need are in window.Rn object.
    await Rn.System.init({
      approach: Rn.ProcessApproach.UniformWebGL2,
      canvas: document.getElementById('world')
    });
    const entityRepository = Rn.EntityRepository.getInstance();
    ...
    (After that, please refer to the sample codes.)
    ...
  }
  </script>
</body>
```

### In TypeScript

There are three package versions of Rhodonite: CommmonJS, ESModule and UMD.

#### Using CommonJS package

You need a bundler (e.g. Webpack) to import the Rhodonite CommonJS package.

```typescript
import Rn from 'rhodonite';

async function load() {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL2,
    canvas: document.getElementById('world') as HTMLCanvasElement
  });

  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent: Rn.CameraComponent = cameraEntity.getCamera();

  ...
  (After that, please refer to the sample codes.)
  ...
}
```

#### Using ESModule package

You don't need any bundler.

```html
<script type="module" src="main.js">
```

```typescript
// main.ts
import Rn from 'rhodonite/dist/esm/index.js';

async function load() {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL2,
    canvas: document.getElementById('world') as HTMLCanvasElement
  });

  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent: Rn.CameraComponent = cameraEntity.getCamera();

  ...
  (After that, please refer to the sample codes.)
  ...
}
```

```
// tsconfig.json
{
  ...
  "compilerOptions": {
    "module": "ESNext",
    ...
  }
  ...
}
```

#### Using UMD package

See the last part of https://github.com/actnwit/RhodoniteTS/wiki/Install .

## Building Rhodonite

### Prerequisites

* Node.js 14.15.5 or later

### Setup Project

```bash
$ yarn install
```

You can use yarn instead.

### Build command for Rhodonite library

```bash
$ yarn build
```

### Build command for samples

```bash
$ yarn build-samples
```

## Try Samples

After building Rhodonite, try:

```bash
$ yarn watch-samples
```

Then, access http://localhost:8082/ with your web browser.
When you are finished, press ctrl + c.

## Build command for API documents

```bash
$ yarn doc
```

## Testing Rhodonite

```bash
$ yarn test
```

You can execute a part of tests like this.

### For unit test

```bash
$ yarn test-unit-part -- ./src/foundation/core
```

```bash
$ yarn test-unit-part -- ./src/foundation/core/Entity.test.ts
```

### For E2E (visual) test

```bash
$ yarn test-e2e-part -- ./samples/test_e2e/FastestInstancedDrawingWebGL1
```

### For M1 Mac in E2E test

If you have trouble with the E2E test in your M1 Mac, Try to install Chromium.

```bash
$ brew install chromium
```
Then try these environment variables.

```bashrc
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=`which chromium`
```

See https://stackoverflow.com/questions/65928783/puppeteer5-5-0-install-node-install-js-on-m1 for more detail.

And you can try to uncomment the "executablePath" line.

```javascript
// config/test/jest-puppeteer.config.js
module.exports = {

  ...

  launch: {
    headless: true,
    devtools: false,
    // executablePath: "/Applications/Chromium.app/Contents/MacOS/Chromium", // Try to uncomment this line if you got error in M1 Mac

    args: ["--start-maximized", "--no-sandbox", "--disable-gpu"],
  },
};
```

## Development using VSCode devcontainer

This project supports the VSCode devcontainer for any docker-installed OS.

Input the following command in the VSCode command palette.

```bash
> Remote-Containers: Reopen in Container
```

After a new dev container window opens, You can work in the Debian Linux container environment. All dependencies (node, npm, yarn, typescript, chromium, and all packages for Rhodonite) are already set up.

## Debugging inside VSCode (Step execution in VSCode Debug tab)

1. Install the "Debugger for Chrome" VSCode Extension.
2. Start the local server with `$ yarn start`.
3. Push the run icon by choosing "Launch Chrome to debug Rhodonite samples" in the RUN tab of VSCode's left pane to start debugging.

If you use the VSCode devcontainer environment, You should open the another RhodoniteTS VSCode window locally and do debug ops on it instead of the devcontainer VSCode window.

## License

MIT License

## Acknowledgements

### Libraries & Tools

Our library uses the following libraries and tools and more. Thank you.

- [immersive-web/webxr-input-profiles](https://github.com/immersive-web/webxr-input-profiles) (forked version)
- [glTF samples](KhronosGroup/glTF-Sample-Models)

Check the complete list on package.json.

### Contributors

![GitHub Contributors Image](https://contrib.rocks/image?repo=actnwit/RhodoniteTS)
