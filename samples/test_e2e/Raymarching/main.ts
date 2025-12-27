import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// Init Rhodonite
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

// Plane
const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
const nodeJson = {
  nodes: [],
  connections: [],
};
const result = Rn.MaterialHelper.createNodeBasedRaymarchingCustomMaterial(engine, nodeJson);
if (!result) {
  throw new Error('Failed to create node-based raymarching custom material');
}
const material = result.material;
renderPass.setBufferLessFullScreenRendering(material);
const raymarchingEntity = Rn.createRaymarchingEntity(engine);
renderPass.addEntities([raymarchingEntity]);
expression.addRenderPasses([renderPass]);

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

  engine.process([expression]);
  count++;
});
