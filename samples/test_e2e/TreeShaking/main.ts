// The same scene as the Simple sample, written the way an application that wants a small bundle uses Rhodonite:
// only named imports (never the default `Rn` namespace export). The page does not load this file directly. It loads
// the bundle that scripts/build-tree-shaking-sample.mjs creates with esbuild, so the bundler tree-shakes everything
// this file does not use, and `__RN_WEBGPU__: false` drops the WGSL shaders. The E2E test checks both the rendering
// and the contents of that bundle.
import { Config, Engine, MeshHelper, ProcessApproach, Vector3 } from 'rhodonite';

declare const window: any;

// Init Rhodonite
const engine = await Engine.init({
  approach: ProcessApproach.WebGL2,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Config({ cgApiDebugConsoleOutput: true }),
});

// Plane
const planeEntity = MeshHelper.createPlane(engine);
planeEntity.localEulerAngles = Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Vector3.fromCopy3(0.5, 0.5, 0.5);

// Optional features stay disabled with named imports (the test checks this as well as the bundle contents).
window._isXREnabled = engine.isXREnabled;

// Render Loop
let count = 0;

engine.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.textContent = 'Rendered.';
    document.body.appendChild(p);
  }

  engine.processAuto();
  count++;
});
