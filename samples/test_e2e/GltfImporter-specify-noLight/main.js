
let p = null;

const load = async function (time) {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));

  const entityRepository = Rn.EntityRepository.getInstance();
  const gltfImporter = Rn.GltfImporter.getInstance();

  // params

  const displayResolution = 800;

  // camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // expresions
  const expressions = [];

  // gltf
  const expression = await gltfImporter.import('../../../assets/gltf/2.0/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf', {
    defaultMaterialHelperArgumentArray: [{
      isLighting: false
    }],
    autoResizeTexture: true,
    cameraComponent: cameraComponent
  });
  expressions.push(expression);


  const componentRepository = Rn.ComponentRepository.getInstance();
  const meshComponents = componentRepository.getComponentsWithType(Rn.MeshComponent);
  setParameterForMeshComponents(meshComponents, Rn.ShaderSemantics.BaseColorFactor, new Rn.Vector4(0.5, 0.5, 0.5, 1.0));

  // post effects
  const expressionPostEffect = new Rn.Expression();
  expressions.push(expressionPostEffect);


  // gamma correction
  const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(displayResolution, displayResolution, 1, {});
  for (let renderPass of expression.renderPasses) {
    renderPass.setFramebuffer(gammaTargetFramebuffer);
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
  }
  expression.renderPasses[0].toClearColorBuffer = true;
  expression.renderPasses[0].toClearDepthBuffer = true;

  const gammaRenderPass = createPostEffectRenderPass('createGammaCorrectionMaterial');
  setTextureParameterForMeshComponents(gammaRenderPass.meshComponents, Rn.ShaderSemantics.BaseColorTexture, gammaTargetFramebuffer.colorAttachments[0]);

  // fxaa
  const fxaaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(displayResolution, displayResolution, 1, {});
  gammaRenderPass.setFramebuffer(fxaaTargetFramebuffer);

  const fxaaRenderPass = createRenderPassSharingEntitiesAndCamera(gammaRenderPass);
  const fxaaMaterial = Rn.MaterialHelper.createFXAA3QualityMaterial();
  fxaaMaterial.setParameter(Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(displayResolution, displayResolution));
  fxaaMaterial.setTextureParameter(Rn.ShaderSemantics.BaseColorTexture, fxaaTargetFramebuffer.colorAttachments[0]);
  fxaaRenderPass.setMaterial(fxaaMaterial);

  expressionPostEffect.addRenderPasses([gammaRenderPass, fxaaRenderPass]);


  //set default camera
  Rn.CameraComponent.main = 0;

  // cameraController
  const mainRenderPass = expression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
  const controller = mainCameraControllerComponent.controller;
  controller.dolly = 0.65;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

  let count = 0;
  let startTime = Date.now();

  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }


    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };

  draw();


  function createPostEffectRenderPass(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
    const boardPrimitive = new Rn.Plane();
    boardPrimitive.generate({
      width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
      material: Rn.MaterialHelper[materialHelperFunctionStr](...arrayOfHelperFunctionArgument)
    });

    const boardEntity = generateEntity();
    boardEntity.getTransform().rotate = new Rn.Vector3(-Math.PI / 2, 0.0, 0.0);
    boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);

    const boardMesh = new Rn.Mesh();
    boardMesh.addPrimitive(boardPrimitive);
    const boardMeshComponent = boardEntity.getComponent(Rn.MeshComponent);
    boardMeshComponent.setMesh(boardMesh);

    if (createPostEffectRenderPass.cameraComponent == null) {
      const entityRepository = Rn.EntityRepository.getInstance();
      const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
      const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
      cameraComponent.zFarInner = 1.0;
      createPostEffectRenderPass.cameraComponent = cameraComponent;
    }

    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
    renderPass.cameraComponent = createPostEffectRenderPass.cameraComponent;
    renderPass.addEntities([boardEntity]);

    return renderPass;
  }

  function createRenderPassSharingEntitiesAndCamera(originalRenderPass) {
    const renderPass = new Rn.RenderPass();
    renderPass.addEntities(originalRenderPass.entities);
    renderPass.cameraComponent = originalRenderPass.cameraComponent;

    return renderPass;
  }

  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }

  function setParameterForMeshComponents(meshComponents, shaderSemantic, value) {
    for (let i = 0; i < meshComponents.length; i++) {
      const mesh = meshComponents[i].mesh;
      if (!mesh) continue;

      const primitiveNumber = mesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveNumber; j++) {
        const primitive = mesh.getPrimitiveAt(j);
        primitive.material.setParameter(shaderSemantic, value);
      }
    }
  }

  function setTextureParameterForMeshComponents(meshComponents, shaderSemantic, value) {
    for (let i = 0; i < meshComponents.length; i++) {
      const mesh = meshComponents[i].mesh;
      if (!mesh) continue;

      const primitiveNumber = mesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveNumber; j++) {
        const primitive = mesh.getPrimitiveAt(j);
        primitive.material.setTextureParameter(shaderSemantic, value);
      }
    }
  }
}

document.body.onload = load;



