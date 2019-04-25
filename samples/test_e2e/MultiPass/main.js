
(function() {
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
  Promise.all(promises).then(function(){
    const system = Rn.System.getInstance();
    const entityRepository = Rn.EntityRepository.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);

    const expression = new Rn.Expression();
    const renderPass1 = new Rn.RenderPass();
    const renderPass2 = new Rn.RenderPass();
    // expression.addRenderPasses([renderPass1]);
    expression.addRenderPasses([renderPass1, renderPass2]);

    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(512, 512, 1, {})
    renderPass1.setFramebuffer(framebuffer);

    const primitive = new Rn.Plane();
    primitive.generate({width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false});
    primitive.material = Rn.MaterialHelper.createClassicUberMaterial();
    const texture = new Rn.Texture();
    texture.generateTextureFromUri('../../../assets/textures/specular_back_1.jpg');
    primitive.material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, texture);
    primitive.material.setParameter(Rn.ShaderSemantics.DiffuseColorFactor, new Rn.Vector4(1, 0, 1, 1));

    const entities = [];
    const entity = generateEntity();
    entities.push(entity);


    const entity2 = generateEntity();
    entities.push(entity2);

    const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
    cameraControllerComponent.setTarget(entity);


    const meshComponent = entity.getComponent(Rn.MeshComponent);
    meshComponent.addPrimitive(primitive);
    entity.getTransform().rotate = new Rn.Vector3(-Math.PI/2, 0, 0);
    const meshComponent2 = entity2.getComponent(Rn.MeshComponent);

    const primitive2 = new Rn.Plane();
    primitive2.generate({width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false});
    primitive2.material = Rn.MaterialHelper.createClassicUberMaterial();
    primitive2.material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, framebuffer.colorAttachments[0]);
    meshComponent2.addPrimitive(primitive2);
    entity2.getTransform().rotate = new Rn.Vector3(-Math.PI/2, 0, 0);
    entity2.getTransform().translate = new Rn.Vector3(1.5, 0, 0);


    renderPass1.addEntities([entity]);
    renderPass2.addEntities([entity2]);
    // renderPass.addEntities([]);


    const startTime = Date.now();
    let p = null;
    const rotationVec3 = Rn.MutableVector3.zero();
    let count = 0

    const stats = new Stats();
    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.domElement );
    const draw = function(time){

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
        entities.forEach(function(entity){
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
    }

    draw();

  });
})();

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}
