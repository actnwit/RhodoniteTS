import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// Init Rhodonite
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

// Plane
const raymarchingEntity = Rn.createRaymarchingEntity(engine);

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
