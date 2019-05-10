
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
    const importer = Rn.Gltf2Importer.getInstance();
    return importer.import('gltf.gltf');
  }).then(function (response) {
    const system = Rn.System.getInstance();
    const entityRepository = Rn.EntityRepository.getInstance();
    const modelConverter = Rn.ModelConverter.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));


    //render passes
    const expression = new Rn.Expression();
    const renderPassMain = new Rn.RenderPass();
    const renderPassFromLight = new Rn.RenderPass();
    expression.addRenderPasses([renderPassMain, renderPassFromLight]);

    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(2048, 2048, 1, {});
    renderPassFromLight.setFramebuffer(framebuffer);
    renderPassFromLight.toClearColorBuffer = true;
    // renderPassMain.toClearColorBuffer = true;


    //Light
    const lightPosition = new Rn.Vector3(0.0, 0.5, -0.5);


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
    const rootGroupSmallForDepth = modelConverter.convertToRhodoniteObject(response);
    const rootGroupLargeForDepth = modelConverter.convertToRhodoniteObject(response);
    entities.push(rootGroupSmallForDepth);
    entities.push(rootGroupLargeForDepth);

    const meshComponentsForDepth = [];
    const sceneGraphComponentSmallForDepth = rootGroupSmallForDepth.getSceneGraph();
    for (let sceneGraphComponent of sceneGraphComponentSmallForDepth.children) {
      meshComponentsForDepth.push(sceneGraphComponent.entity.getComponent(Rn.MeshComponent));
    }
    const sceneGraphComponentLargeForDepth = rootGroupLargeForDepth.getSceneGraph();
    for (let sceneGraphComponent of sceneGraphComponentLargeForDepth.children) {
      meshComponentsForDepth.push(sceneGraphComponent.entity.getComponent(Rn.MeshComponent));
    }


    //primitives for depth shader
    for (let meshComponent of meshComponentsForDepth) {
      for (let i = 0; i < meshComponent.getPrimitiveNumber(); i++) {
        const primitive = meshComponent.getPrimitiveAt(i);
        primitive.material = Rn.MaterialHelper.createDepthEncodingMaterial();
      }
    }

    renderPassFromLight.addEntities([rootGroupSmallForDepth, rootGroupLargeForDepth]);


    //entities and components for shadow mapping
    const rootGroupSmall = modelConverter.convertToRhodoniteObject(response);
    const rootGroupLarge = modelConverter.convertToRhodoniteObject(response);
    entities.push(rootGroupSmall);
    entities.push(rootGroupLarge);

    const meshComponents = [];
    const sceneGraphComponentSmall = rootGroupSmall.getSceneGraph();
    for (let sceneGraphComponent of sceneGraphComponentSmall.children) {
      meshComponents.push(sceneGraphComponent.entity.getComponent(Rn.MeshComponent));
    }

    const sceneGraphComponentLarge = rootGroupLarge.getSceneGraph();
    for (let sceneGraphComponent of sceneGraphComponentLarge.children) {
      meshComponents.push(sceneGraphComponent.entity.getComponent(Rn.MeshComponent));
    }


    //primitives for shadow mapping
    const primitives = [];
    for (let meshComponent of meshComponents) {
      for (let i = 0; i < meshComponent.getPrimitiveNumber(); i++) {
        const primitive = meshComponent.getPrimitiveAt(i);
        primitive.material = Rn.MaterialHelper.createShadowMapping32bitMaterial(renderPassFromLight);
        if (primitives.length === 0) {
          primitive.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(0.7, 0.6, 0.5, 1));
        } else {
          primitive.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(0.75, 0.65, 0.55, 1));
        }
        primitives.push(primitive);
      }
    }

    renderPassMain.addEntities([rootGroupSmall, rootGroupLarge]);


    //transforming the entities

    rootGroupSmallForDepth.getTransform().rotate = new Rn.Vector3(0.0, Math.PI / 2, 0);
    rootGroupSmall.getTransform().rotate = new Rn.Vector3(0.0, Math.PI / 2, 0);
    rootGroupSmallForDepth.getTransform().translate = new Rn.Vector3(0.0, 0.2, -1.2);
    rootGroupSmall.getTransform().translate = new Rn.Vector3(0.0, 0.2, -1.2);
    rootGroupSmallForDepth.getTransform().scale = new Rn.Vector3(0.5, 0.5, 0.5);
    rootGroupSmall.getTransform().scale = new Rn.Vector3(0.5, 0.5, 0.5);

    rootGroupLargeForDepth.getTransform().rotate = new Rn.Vector3(0.0, Math.PI, 0);
    rootGroupLarge.getTransform().rotate = new Rn.Vector3(0.0, Math.PI, 0);
    rootGroupLargeForDepth.getTransform().translate = new Rn.Vector3(0, 0, -1.5);
    rootGroupLarge.getTransform().translate = new Rn.Vector3(0, 0, -1.5);
    rootGroupLargeForDepth.getTransform().scale = new Rn.Vector3(2.0, 2.0, 2.0);
    rootGroupLarge.getTransform().scale = new Rn.Vector3(2.0, 2.0, 2.0);



    //camera controller
    const cameraControllerComponent = cameraEntityMain.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.setTarget(rootGroupLarge);

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
