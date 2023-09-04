import Rn, { EntityHelper } from '../../../dist/esmdev/index.js';

declare const window: any;
(function () {
  window.Rn = Rn;
  //    import Rn from '../../../dist/rhodonite.mjs';
  function readyBasicVerticesData() {
    // Triangle
    const positions = new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0]);
    const indices = new Uint32Array([0, 1, 2]);

    const flatMaterial = Rn.MaterialHelper.createFlatMaterial();

    const primitive = Rn.Primitive.createPrimitive({
      material: flatMaterial,
      attributeSemantics: [Rn.VertexAttribute.Position.XYZ],
      indices,
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
    // entityOrig.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0, 1, 0);
    entities.push(entityOrig);
    // const flatMaterial = Rn.MaterialHelper.createFlatMaterial();
    // const sphere = Rn.MeshHelper.createSphere({
    //   radius: 0.5,
    //   widthSegments: 32,
    //   heightSegments: 32,
    //   material: flatMaterial,
    // });
    // entities.push(sphere);

    let count = 0;

    const camera = Rn.EntityHelper.createCameraEntity();
    camera.position = Rn.Vector3.fromCopy3(0.0, 0.0, 2.0);
    const camera2 = Rn.EntityHelper.createCameraEntity();
    camera2.position = Rn.Vector3.fromCopy3(1.0, 0.0, 2.0);

    // renderPass
    const renderPass = new Rn.RenderPass();
    renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities(entities);
    renderPass.cameraComponent = camera.getCamera();

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
