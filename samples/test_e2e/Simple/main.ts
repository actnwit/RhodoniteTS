import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// Init Rhodonite
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

// Plane
const planeEntity = Rn.MeshHelper.createPlane(engine);
planeEntity.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Rn.Vector3.fromCopy3(0.5, 0.5, 0.5);

// Render Loop
let count = 0;

engine.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  engine.processAuto();
  count++;
});
