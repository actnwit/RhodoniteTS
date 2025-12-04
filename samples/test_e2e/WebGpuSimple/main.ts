import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
(() => {
  window.Rn = Rn;
  //    import Rn from '../../../dist/rhodonite.mjs';
  async function readyBasicVerticesData(engine: Rn.Engine) {
    // Triangle
    const positions = new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0]);
    const texcoord = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.0]);
    const indices = new Uint32Array([0, 1, 2]);

    const flatMaterial = Rn.MaterialHelper.createFlatMaterial(engine);

    const texture = await Rn.Texture.loadFromUrl(engine, '../../../assets/images/Rn.png');
    const sampler = new Rn.Sampler(engine, {
      minFilter: Rn.TextureParameter.Linear,
      magFilter: Rn.TextureParameter.Linear,
      wrapS: Rn.TextureParameter.Repeat,
      wrapT: Rn.TextureParameter.Repeat,
    });
    sampler.create();
    flatMaterial.setTextureParameter('baseColorTexture', texture, sampler);
    const primitive = Rn.Primitive.createPrimitive(engine, {
      material: flatMaterial,
      attributeSemantics: [Rn.VertexAttribute.Position.XYZ, Rn.VertexAttribute.Texcoord0.XY],
      indices,
      attributes: [positions, texcoord],
      primitiveMode: Rn.PrimitiveMode.Triangles,
    });

    return primitive;
  }
  const promises: Promise<void>[] = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgpu'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(async () => {
    const engine = await Rn.Engine.init({
      approach: Rn.ProcessApproach.WebGPU,
      canvas: document.getElementById('world') as HTMLCanvasElement,
      config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info }),
    });
    window.engine = engine;

    const primitive = await readyBasicVerticesData(engine);

    const entities = [];
    const originalMesh = new Rn.Mesh(engine);
    originalMesh.addPrimitive(primitive);
    const entityOrig = Rn.createMeshEntity(engine);
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

    const camera = Rn.createCameraEntity(engine, true);
    camera.position = Rn.Vector3.fromCopy3(0.0, 0.0, 2.0);

    // renderPass
    const renderPass = new Rn.RenderPass(engine);
    renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities(entities);
    renderPass.cameraComponent = camera.getCamera();

    // expression
    const expression = new Rn.Expression();
    expression.addRenderPasses([renderPass]);
    let startTimeForPerformanceNow = 0;
    const draw = () => {
      if (count > 0) {
        window._rendered = true;
      }

      //      console.log(date.getTime());
      engine.process([expression]);

      const t0 = Rn.Engine.timeAtProcessBegin;
      const t1 = Rn.Engine.timeAtProcessEnd;
      const msec = t1 - t0;
      const sec = msec / 1000;
      const virtualFps = 1.0 / sec;
      const duration = t1 - startTimeForPerformanceNow;
      if (duration > 1000) {
        console.log(`draw time: ${msec} msec, virtual fps: ${virtualFps} fps`);
        startTimeForPerformanceNow = t1;
      }

      count++;
      requestAnimationFrame(draw);
    };

    draw();
  });
})();

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(window.engine, 'Rhodonite');
};
