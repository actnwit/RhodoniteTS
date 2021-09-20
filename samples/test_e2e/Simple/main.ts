// import RnForType from '../../import';
import RnForType from '../../../dist/esm';
import type {Window} from '../../test_e2e/common/types';
declare const Rn: typeof RnForType;

declare const window: Window;

(async window => {
  // Init Rhodonite
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.FastestWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  // Plane
  const planeEntity = Rn.MeshHelper.createPlane();
  planeEntity.getTransform().rotate = new Rn.Vector3(Math.PI, 0, 0);
  planeEntity.getTransform().scale = new Rn.Vector3(0.1, 0.1, 0.1);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.clearColor = new Rn.Vector3(0, 0, 1);
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([planeEntity]);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  // Render Loop
  let count = 0;
  const draw = function () {
    if (!window._rendered && count > 0) {
      window._rendered = true;
      const p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    system.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})(window);
