
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

    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);

    const expression = new Rn.Expression();
    const renderPass1 = new Rn.RenderPass();
    renderPass1.toClearColorBuffer = true;
    renderPass1.cameraComponent = cameraComponent;
    const renderPass2 = new Rn.RenderPass();
    renderPass2.toClearColorBuffer = true;
    renderPass2.cameraComponent = cameraComponent;
    const renderPass_fxaa = new Rn.RenderPass();
    renderPass_fxaa.toClearColorBuffer = true;
    const cameraEntity_fxaa = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent])
    const cameraComponent_fxaa = cameraEntity_fxaa.getComponent(Rn.CameraComponent);
    cameraEntity_fxaa.getTransform().translate = new Rn.Vector3(0.0, 0.0, 1.0);
    cameraComponent_fxaa.type = Rn.CameraType.Orthographic;
    renderPass_fxaa.cameraComponent = cameraComponent_fxaa;


    // expression.addRenderPasses([renderPass1]);
    expression.addRenderPasses([renderPass1, renderPass2, renderPass_fxaa]);

    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(600, 600, 1, {})
    renderPass1.setFramebuffer(framebuffer);

    const framebuffer_fxaatarget = Rn.RenderableHelper.createTexturesForRenderTarget(600, 600, 1, {})
    renderPass2.setFramebuffer(framebuffer_fxaatarget);


    const primitive = new Rn.Plane();
    primitive.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitive.material = Rn.MaterialHelper.createClassicUberMaterial({});
    // const texture = new Rn.Texture();
    //texture.generateTextureFromUri('../../../assets/textures/specular_back_1.jpg');
    //primitive.material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, texture);
    primitive.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(1, 0, 1, 1));

    const entities = [];
    const entity = generateEntity();
    entities.push(entity);

    const entity2 = generateEntity();
    entities.push(entity2);

    const entity_fxaa = generateEntity();
    entities.push(entity_fxaa);

    const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.controller.setTarget(entity);


    const meshComponent = entity.getComponent(Rn.MeshComponent);
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    entity.getTransform().rotate = new Rn.Vector3(-Math.PI / 2, 0, 0);
    const meshComponent2 = entity2.getComponent(Rn.MeshComponent);

    const primitive2 = new Rn.Plane();
    primitive2.generate({ width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitive2.material = Rn.MaterialHelper.createClassicUberMaterial({});
    primitive2.material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, framebuffer.colorAttachments[0]);

    const mesh2 = new Rn.Mesh();
    mesh2.addPrimitive(primitive2);
    meshComponent2.setMesh(mesh2);
    entity2.getTransform().rotate = new Rn.Vector3(-Math.PI * 2 / 3, 0, 0);
    entity2.getTransform().translate = new Rn.Vector3(0, 0, 0);

    const primitive_fxaa = new Rn.Plane();
    primitive_fxaa.generate({ width: 2, height: 2, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitive_fxaa.material = Rn.MaterialHelper.createFXAA3QualityMaterial();
    primitive_fxaa.material.setTextureParameter(Rn.ShaderSemantics.BaseColorTexture, framebuffer_fxaatarget.colorAttachments[0]);
    primitive_fxaa.material.setParameter(Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(600, 600));
    const meshComponent_fxaa = entity_fxaa.getComponent(Rn.MeshComponent);
    const mesh_fxaa = new Rn.Mesh();
    mesh_fxaa.addPrimitive(primitive_fxaa);
    meshComponent_fxaa.setMesh(mesh_fxaa);
    entity_fxaa.getTransform().rotate = new Rn.Vector3(-Math.PI / 2, 0, 0);
    entity_fxaa.getTransform().translate = new Rn.Vector3(0, 0, 0);


    renderPass1.addEntities([entity]);
    renderPass2.addEntities([entity2]);
    renderPass_fxaa.addEntities([entity_fxaa]);
    // renderPass.addEntities([]);


    const startTime = Date.now();
    let p = null;
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0

    const stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.domElement);
    const draw = function (time) {

      if (p == null && count > 0) {
        p = document.createElement('p');
        p.setAttribute("id", "rendered");
        p.innerText = 'Rendered.';
        document.body.appendChild(p);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, 600, 600);

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
      system.process([expression]);

      stats.end();
      count++;
      requestAnimationFrame(draw);
    }

    draw();

  });
})();

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
