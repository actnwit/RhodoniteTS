import _Rn from '../../../dist/esm/index';

declare const Stats: any;
declare const window: any;
declare const Rn: typeof _Rn;
(function () {
  //    import Rn from '../../../dist/rhodonite.mjs';
  function readyBasicVerticesData() {
    const indices = new Uint16Array([
      //        0, 1, 2, 2, 3, 0

      3, 1, 0, 2, 1, 3, 4, 5, 7, 7, 5, 6, 8, 9, 11, 11, 9, 10, 15, 13, 12, 14,
      13, 15, 19, 17, 16, 18, 17, 19, 20, 21, 23, 23, 21, 22,
    ]);

    const positions = new Float32Array([
      // -1, -1, 0.0,
      //  1, -1, 0.0,
      //  1, 1, 0.0,
      // -1, 1, 0.0

      // upper
      -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1,
      // lower
      -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
      // front
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      // back
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
      // right
      1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1,
      // left
      -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
    ]);

    const colors = new Float32Array([
      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,

      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
    ]);

    const primitive = Rn.Primitive.createPrimitive({
      indices: indices,
      attributeSemantics: [
        Rn.VertexAttribute.Position.XYZ,
        Rn.VertexAttribute.Color0.XYZ,
      ],
      attributes: [positions, colors],
      primitiveMode: Rn.PrimitiveMode.Triangles,
    });

    return primitive;
  }

  const promises: Promise<void>[] = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(async () => {
    const gl = await Rn.System.init({
      approach: Rn.ProcessApproach.FastestWebGL1,
      canvas: document.getElementById('world') as HTMLCanvasElement,
    });

    gl.enable(gl.DEPTH_TEST);

    gl.viewport(0, 0, 600, 600);

    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const primitive = readyBasicVerticesData();

    const entities = [];
    const entityNumber = 100;
    const originalMesh = new Rn.Mesh();
    originalMesh.addPrimitive(primitive);
    for (let i = 0; i < entityNumber; i++) {
      const sqrtEntityNumber = Math.floor(Math.sqrt(entityNumber));
      const entity = Rn.EntityHelper.createMeshEntity();

      entities.push(entity);
      const meshComponent = entity.getMesh();

      // Instansing
      if (i === 0) {
        meshComponent.setMesh(originalMesh);
      } else {
        const mesh = new Rn.Mesh();
        mesh.setOriginalMesh(originalMesh);
        meshComponent.setMesh(mesh);
      }
      entity.getTransform().toUpdateAllTransform = false;

      // Non Instansing
      // const mesh = new Rn.Mesh();
      // mesh.addPrimitive(primitive);
      // meshComponent.setMesh(mesh);

      entity.getTransform().scale = Rn.Vector3.fromCopyArray([
        1 / sqrtEntityNumber / 2,
        1 / sqrtEntityNumber / 2,
        1 / sqrtEntityNumber / 2,
      ]);
      entity.getTransform().translate = Rn.Vector3.fromCopyArray([
        (1 / sqrtEntityNumber) * 2 * (i % sqrtEntityNumber) -
          1.0 +
          1 / sqrtEntityNumber,
        (Math.floor(i / sqrtEntityNumber) / sqrtEntityNumber) * 2 -
          1.0 +
          1 / sqrtEntityNumber,
        0.0,
      ]);
    }

    const startTime = Date.now();
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0;

    // renderPass
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities(entities);

    // expression
    const expression = new Rn.Expression();
    expression.addRenderPasses([renderPass]);

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.domElement);

    const draw = function () {
      if (count > 0) {
        window._rendered = true;
      }

      const date = new Date();

      if (window.isAnimating) {
        const rotation = 0.001 * (date.getTime() - startTime);
        entities.forEach(entity => {
          rotationVec3._v[0] = rotation;
          rotationVec3._v[1] = rotation;
          rotationVec3._v[2] = rotation;
          entity.getTransform().rotate = rotationVec3;
        });
      }
      stats.begin();

      //      console.log(date.getTime());
      Rn.System.process([expression]);

      stats.end();
      count++;
      requestAnimationFrame(draw);
    };

    draw();
  });
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
