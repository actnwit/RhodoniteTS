
(function () {
  //    import Rn from '../../../dist/rhodonite.mjs';
  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
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

    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(4096, 4096, 1, {});
    renderPassFromLight.setFramebuffer(framebuffer);
    renderPassFromLight.toClearColorBuffer = true;
    // renderPassMain.toClearColorBuffer = true;


    //Light
    const lightPosition = new Rn.Vector3(0.0, 3.0, 5.0);


    //cameras
    const cameraEntityMain = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
    const cameraEntityFromLight = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);

    const cameraComponentMain = cameraEntityMain.getComponent(Rn.CameraComponent);
    const cameraComponentFromLight = cameraEntityFromLight.getComponent(Rn.CameraComponent);
    renderPassMain.cameraComponent = cameraComponentMain;
    renderPassFromLight.cameraComponent = cameraComponentFromLight;

    cameraEntityFromLight.getTransform().translate = lightPosition;


    //entities and components for depth shader

    const entities = [];
    const entitySmallForDepth = generateEntity();
    const entityLargeForDepth = generateEntity();
    entities.push(entitySmallForDepth);
    entities.push(entityLargeForDepth);

    const meshComponentSmallForDepth = entitySmallForDepth.getComponent(Rn.MeshComponent);
    const meshComponentLargeForDepth = entityLargeForDepth.getComponent(Rn.MeshComponent);


    //primitives for depth shader

    const primitiveSmallSquareForDepth = new Rn.Plane();
    primitiveSmallSquareForDepth.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveSmallSquareForDepth.material = Rn.MaterialHelper.createDepthEncodingMaterial();
    meshComponentSmallForDepth.addPrimitive(primitiveSmallSquareForDepth);

    const primitiveLargeSquareForDepth = new Rn.Plane();
    primitiveLargeSquareForDepth.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveLargeSquareForDepth.material = Rn.MaterialHelper.createDepthEncodingMaterial();
    meshComponentLargeForDepth.addPrimitive(primitiveLargeSquareForDepth);

    renderPassFromLight.addEntities([entitySmallForDepth, entityLargeForDepth]);


    //entities and components for shadow mapping
    const entitySmall = generateEntity();
    const entityLarge = generateEntity();
    entities.push(entitySmall);
    entities.push(entityLarge);

    const meshComponentSmall = entitySmall.getComponent(Rn.MeshComponent);
    const meshComponentLarge = entityLarge.getComponent(Rn.MeshComponent);


    //primitives for shadow mapping
    const primitives = [];
    const primitiveSmallSquare = new Rn.Plane();
    primitiveSmallSquare.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveSmallSquare.material = Rn.MaterialHelper.createShadowMapping32bitMaterial(renderPassFromLight);
    primitiveSmallSquare.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(0.5, 0.1, 0.4, 1));
    meshComponentSmall.addPrimitive(primitiveSmallSquare);
    primitives.push(primitiveSmallSquare);

    const primitiveLargeSquare = new Rn.Plane();
    primitiveLargeSquare.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveLargeSquare.material = Rn.MaterialHelper.createShadowMapping32bitMaterial(renderPassFromLight);
    primitiveLargeSquare.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(0.1, 0.7, 0.5, 1));
    meshComponentLarge.addPrimitive(primitiveLargeSquare);
    primitives.push(primitiveLargeSquare);

    renderPassMain.addEntities([entitySmall, entityLarge]);


    //transforming the entities

    entitySmallForDepth.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);
    entitySmall.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);
    entitySmallForDepth.getTransform().translate = new Rn.Vector3(0.0, 0.0, -1.0);
    entitySmall.getTransform().translate = new Rn.Vector3(0.0, 0.0, -1.0);
    entitySmallForDepth.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);
    entitySmall.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);

    entityLargeForDepth.getTransform().translate = new Rn.Vector3(0, 0, -1.5);
    entityLarge.getTransform().translate = new Rn.Vector3(0, 0, -1.5);
    entityLargeForDepth.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);
    entityLarge.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0, 0);


    //camera controller
    const cameraControllerComponent = cameraEntityMain.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.setTarget(entityLarge);

    renderPassMain.cameraComponent.zFarInner = 50.0;
    renderPassFromLight.cameraComponent.zFarInner = 50.0;

    const startTime = Date.now();
    let p = null;
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0;

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.domElement);

    let inputValue = 0;
    let lightEntityPosition = new Rn.MutableVector3(cameraEntityFromLight.getTransform().translate);

    const draw = function (time) {
      lightEntityPosition.x -= inputValue;
      inputValue = parseFloat(document.getElementById('light_pos').value) / 200;
      lightEntityPosition.x += inputValue;

      cameraEntityFromLight.getTransform().translate = lightEntityPosition;
      for (const primitive of primitives) {
        primitive.material.setParameter(Rn.ShaderSemantics.LightViewProjectionMatrix, cameraComponentFromLight.viewProjectionMatrix);
      }

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
