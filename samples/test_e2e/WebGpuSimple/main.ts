import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
(function () {
  window.Rn = Rn;
  //    import Rn from '../../../dist/rhodonite.mjs';
  function readyBasicVerticesData() {
    // Triangle
    const positions = new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0]);

    const flatMaterial = Rn.MaterialHelper.createFlatMaterial();

    const primitive = Rn.Primitive.createPrimitive({
      material: flatMaterial,
      attributeSemantics: [Rn.VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: Rn.PrimitiveMode.Triangles,
    });

    return primitive;
  }

  const promises: Promise<void>[] = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgpu'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(async () => {
    const gl = await Rn.System.init({
      approach: Rn.ProcessApproach.WebGPU,
      canvas: document.getElementById('world') as HTMLCanvasElement,
    });

    const primitive = readyBasicVerticesData();

    const entities = [];
    const originalMesh = new Rn.Mesh();
    originalMesh.addPrimitive(primitive);
    const entityOrig = Rn.EntityHelper.createMeshEntity();
    entityOrig.getMesh().setMesh(originalMesh);
    entities.push(entityOrig);

    let count = 0;

    // renderPass
    const renderPass = new Rn.RenderPass();
    renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities(entities);

    // expression
    const expression = new Rn.Expression();
    expression.addRenderPasses([renderPass]);

    const draw = function () {
      if (count > 0) {
        window._rendered = true;
      }

      //      console.log(date.getTime());
      Rn.System.process([expression]);

      count++;
      requestAnimationFrame(draw);
    };

    draw();
  });
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
