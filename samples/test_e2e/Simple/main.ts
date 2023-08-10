import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// Init Rhodonite
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Plane
const planeEntity = Rn.MeshHelper.createPlane();
planeEntity.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Rn.Vector3.fromCopy3(0.5, 0.5, 0.5);

// Render Loop
let count = 0;

Rn.System.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  Rn.System.processAuto();
  count++;
});
