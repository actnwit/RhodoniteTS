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
  const vrmModelRotation = new Rn.Vector3(0, Math.PI, 0.0);

  // camera
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
  const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // expresions
  const expressions = [];

  // env
  const envExpression = createEnvCubeExpression('./environment');
  expressions.push(envExpression);


  // vrm
  const vrmExpression = await gltfImporter.import('./vrm.vrm', {
    defaultMaterialHelperArgumentArray: [{
      isSkinning: false,
      isMorphing: false,
    }],
    autoResizeTexture: true,
    tangentCalculationMode: 0,
    cameraComponent: cameraComponent
  });
  expressions.push(vrmExpression);

  const vrmMainRenderPass = vrmExpression.renderPasses[0];
  const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
  vrmRootEntity.getTransform().rotate = vrmModelRotation;


  // post effects
  const expressionPostEffect = new Rn.Expression();
  expressions.push(expressionPostEffect);

  // gamma correction (and super sampling)
  const gammaTargetRenderPasses = envExpression.renderPasses.concat(vrmExpression.renderPasses);
  const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(displayResolution * 2, displayResolution * 2, 1, {});
  for (let renderPass of gammaTargetRenderPasses) {
    renderPass.setFramebuffer(gammaTargetFramebuffer);
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
  }
  gammaTargetRenderPasses[0].toClearColorBuffer = true;
  gammaTargetRenderPasses[0].toClearDepthBuffer = true;

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
  const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
  const controller = cameraControllerComponent.controller;
  controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);
  controller.zFarAdjustingFactorBasedOnAABB = 2000;


  // Lights
  const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  const lightComponent = lightEntity.getComponent(Rn.LightComponent);
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);


  let count = 0;
  const draw = function (time) {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      // const date = new Date();
    }

    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };

  draw();

};


document.body.onload = load;

function createEnvCubeExpression(uri) {
  const entityRepository = Rn.EntityRepository.getInstance();
  const sphereEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  const spherePrimitive = new Rn.Sphere();
  window.sphereEntity = sphereEntity;
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = uri + '/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();
  sphereMaterial.setTextureParameter(Rn.ShaderSemantics.ColorEnvTexture, environmentCubeTexture);
  spherePrimitive.generate({ radius: 50, widthSegments: 40, heightSegments: 40, material: sphereMaterial });
  const sphereMeshComponent = sphereEntity.getComponent(Rn.MeshComponent);
  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);
  sphereMeshComponent.setMesh(sphereMesh);
  sphereEntity.getTransform().scale = new Rn.Vector3(-1, 1, 1);
  sphereEntity.getTransform().translate = new Rn.Vector3(0, 20, -20);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

function createPostEffectRenderPass(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
    material: Rn.MaterialHelper[materialHelperFunctionStr].apply(this, arrayOfHelperFunctionArgument)
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
  const entityRepository = Rn.EntityRepository.getInstance();
  const entity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  return entity;
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


