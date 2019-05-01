
(function () {
  //    import Rn from '../../../dist/rhodonite.mjs';
  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }
  function generateGroupEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent]);
    //    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }

  const promises = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(function () {
    const system = Rn.System.getInstance();
    const entityRepository = Rn.EntityRepository.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));


    //render passes
    const expression = new Rn.Expression();
    const renderPassMain = new Rn.RenderPass();
    const renderPassFromLight = new Rn.RenderPass();
    expression.addRenderPasses([renderPassMain, renderPassFromLight]);

    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(512, 512, 1, {});
    renderPassFromLight.setFramebuffer(framebuffer);
    renderPassFromLight.toClearColorBuffer = true;
    // renderPassMain.toClearColorBuffer = true;


    //Lights
    const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent]);
    const lightPosition = new Rn.Vector3(0.0, 0.0, 10.0);

    lightEntity.getTransform().translate = lightPosition;
    lightEntity.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);


    //cameras
    const cameraEntityMain = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
    const cameraEntityFromLight = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);

    const cameraComponentMain = cameraEntityMain.getComponent(Rn.CameraComponent);
    const cameraComponentFromLght = cameraEntityFromLight.getComponent(Rn.CameraComponent);
    renderPassMain.cameraComponent = cameraComponentMain;
    renderPassFromLight.cameraComponent = cameraComponentFromLght;
    Rn.CameraComponent.main = cameraComponentMain.componentSID;

    // cameraEntityMain.getTransform().translate = new Rn.Vector3(0.0, 0.0, 0.0);
    cameraEntityFromLight.getTransform().translate = lightPosition;


    //entities and components
    const entities = [];
    const entitySmall = generateEntity();
    const entityLarge = generateEntity();
    entities.push(entitySmall);
    entities.push(entityLarge);

    const meshComponentSmall = entitySmall.getComponent(Rn.MeshComponent);
    const meshComponentLarge = entityLarge.getComponent(Rn.MeshComponent);


    //primitives
    const primitiveSmallSquare = new Rn.Plane();
    primitiveSmallSquare.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveSmallSquare.material = Rn.MaterialHelper.createDepthEncodingMaterial();
    meshComponentSmall.addPrimitive(primitiveSmallSquare);
    entitySmall.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);
    entitySmall.getTransform().translate = new Rn.Vector3(0, 0, -1.0);
    entitySmall.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);

    const primitiveLargeSquare = new Rn.Plane();
    primitiveLargeSquare.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveLargeSquare.material = Rn.MaterialHelper.createDepthEncodingMaterial();
    meshComponentLarge.addPrimitive(primitiveLargeSquare);
    entityLarge.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);
    entityLarge.getTransform().translate = new Rn.Vector3(0, 0, -1.5);

    renderPassFromLight.addEntities([entitySmall]);
    renderPassMain.addEntities([entitySmall, entityLarge]);


    //camera controller
    const cameraControllerComponent = cameraEntityMain.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.setTarget(entityLarge);


    const startTime = Date.now();
    let p = null;
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0;

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.domElement);
    const draw = function (time) {

      if (p == null && count > 0) {
        p = document.createElement('p');
        p.setAttribute('id', 'rendered');
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, 512, 512);

      const date = new Date();

      if (window.isAnimating) {
        const rotation = 0.001 * (date.getTime() - startTime);
        entities.forEach(function (entity) {
          rotationVec3.v[0] = rotation;
          rotationVec3.v[1] = rotation;
          rotationVec3.v[2] = rotation;
          entity.getTransform().rotate = rotationVec3;
        });
      }
      stats.begin();

      //      console.log(date.getTime());
      system.process(expression);

      stats.end();
      count++;
      requestAnimationFrame(draw);
    };

    draw();

  });
})();

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
