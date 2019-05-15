
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
    const importer = Rn.DrcPointCloudImporter.getInstance();
    return importer.importPointCloud('draco.drc', 'texture.jpg');
  }).then(function (response) {
    const system = Rn.System.getInstance();
    const modelConverter = Rn.ModelConverter.getInstance();
    const entityRepository = Rn.EntityRepository.getInstance();
    const componentRepository = Rn.ComponentRepository.getInstance();

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


    //Light for shadow
    let lightPosition = new Rn.Vector3(0, 0, 0);
    const lightRotation = new Rn.Vector3(0, 0, 0);


    //cameras
    const cameraEntityMain = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
    const cameraEntityFromLight = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);

    const cameraComponentMain = cameraEntityMain.getComponent(Rn.CameraComponent);
    const cameraComponentFromLight = cameraEntityFromLight.getComponent(Rn.CameraComponent);
    renderPassMain.cameraComponent = cameraComponentMain;
    renderPassFromLight.cameraComponent = cameraComponentFromLight;

    cameraEntityFromLight.getTransform().translate = lightPosition;
    cameraEntityFromLight.getTransform().rotate = lightRotation;


    //entities and components for depth shader

    const entities = [];
    const rootGroupForDepth = modelConverter.convertToRhodoniteObject(response);
    rootGroupForDepth.getTransform().translate = new Rn.Vector3(0, 0, 0);
    entities.push(rootGroupForDepth);


    //primitives for depth shader
    let meshComponents = componentRepository.getComponentsWithType(Rn.MeshComponent);
    let meshComponentSIDsForDepth = [];
    for (let meshComponent of meshComponents) {
      for (let i = 0; i < meshComponent.getPrimitiveNumber(); i++) {
        const primitive = meshComponent.getPrimitiveAt(i);
        primitive.material = Rn.MaterialHelper.createDepthEncodingMaterial();
        // primitive.material.setParameter(Rn.ShaderSemantics.PointSize, 200.0);
        // primitive.material.setParameter(Rn.ShaderSemantics.PointDistanceAttenuation, new Rn.Vector3(0.0, 0.1, 0.01));
      }
      meshComponentSIDsForDepth.push(meshComponent.componentSID);
    }

    renderPassFromLight.addEntities([rootGroupForDepth]);


    //entities and components for shadow mapping
    const rootGroup = modelConverter.convertToRhodoniteObject(response);
    rootGroup.getTransform().translate = new Rn.Vector3(0, 0, 0);
    entities.push(rootGroup);


    //primitives for shadow mapping
    const primitives = [];
    for (let meshComponent of meshComponents) {
      let meshComponentForDepth = false;
      for (let i = 0; i < meshComponentSIDsForDepth.length; i++) {
        if (meshComponent.componentSID === meshComponentSIDsForDepth[i]) meshComponentForDepth = true;
      }
      if (meshComponentForDepth) continue;

      for (let i = 0; i < meshComponent.getPrimitiveNumber(); i++) {
        const material = Rn.MaterialHelper.createShadowMapping32bitMaterial(renderPassFromLight);

        const primitive = meshComponent.getPrimitiveAt(i);
        const materialOrigin = primitive.material;

        for (let i in Rn.ShaderSemantics) {
          const param = materialOrigin.getParameter(Rn.ShaderSemantics[i]);
          if (param) {
            if (!material.getParameter(Rn.ShaderSemantics[i])) {
              if (Rn.ShaderSemantics[i].str === 'baseColorFactor') {
                material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, param);
              }
              if (Rn.ShaderSemantics[i].str === 'baseColorTexture') {
                material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, param[1]);
              }
              continue;
            }
            if (Array.isArray(param)) {
              material.setTextureParameter(Rn.ShaderSemantics[i], param[1]);
            } else {
              material.setParameter(Rn.ShaderSemantics[i], param);
            }
          }
        }
        primitive.material = material;
        primitives.push(primitive);
      }
    }

    renderPassMain.addEntities([rootGroup]);


    //transforming the entities

    // rootGroupForDepth.getTransform().translate = new Rn.Vector3(0.0, 0.2, -1.2);
    // rootGroup.getTransform().translate = new Rn.Vector3(0.0, 0.2, -1.2);
    // rootGroupForDepth.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);
    // rootGroup.getTransform().scale = new Rn.Vector3(1.0, 1.0, 1.0);


    //camera controller
    const cameraControllerComponent = cameraEntityMain.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.setTarget(rootGroup);

    // renderPassMain.cameraComponent.zFarInner = 15000.0;
    // renderPassFromLight.cameraComponent.zFarInner = 15000.0;

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
      inputValue = 3 * parseFloat(document.getElementById('light_pos').value);
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

      lightPosition = cameraComponentMain.eyeInner;

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
