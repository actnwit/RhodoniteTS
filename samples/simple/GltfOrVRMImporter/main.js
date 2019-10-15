let p = null;

const load = async function (time) {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL2, document.getElementById('world'));

  const GltfOrVRMImporter = Rn.GltfOrVRMImporter.getInstance();
  const entityRepository = Rn.EntityRepository.getInstance();


  // params
  // const rootGroupScale = new Rn.Vector3(1, 1, 1);

  const displayResolution = 800;

  // rootGroups[0]: main entity, rootGroups[1]: outline entity(if exist)
  const expression = await GltfOrVRMImporter.import('./vrm.vrm', {
    gltfOptions: {
      defaultMaterialHelperArgumentArray: [{ isLighting: true }],
      // autoResizeTexture: true
    },
    // cameraControllerType: Rn.CameraControllerType.WalkThrough
  });

  // Env Cube
  const sphereEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  const spherePrimitive = new Rn.Sphere();
  window.sphereEntity = sphereEntity;
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = './environment';
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

  const renderPasses = expression.renderPasses;
  const renderPassMain = renderPasses[0];
  renderPassMain.addEntities([sphereEntity]);


  // Gammma
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(displayResolution * 2, displayResolution * 2, 1, {});
  for (let renderPass of renderPasses) {
    renderPass.setFramebuffer(framebuffer);
  }

  const renderPassGamma = renderPassHelperForPostEffect('createGammaCorrectionMaterial');
  setTextureParameterForMeshComponents(renderPassGamma.meshComponents, Rn.ShaderSemantics.BaseColorTexture, framebuffer.colorAttachments[0]);

  expression.addRenderPasses(renderPassGamma);


  // Lights
  const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  const lightComponent = lightEntity.getComponent(Rn.LightComponent);
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = new Rn.Vector3(1.0, 1.0, 1.0);
  lightEntity.getTransform().rotate = new Rn.Vector3(0.0, 0.0, Math.PI / 8);

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  // const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  let rot = 0;

  const draw = function (time) {
    if (p == null && count > 0) {
      // if (rootGroups[0] != null) {

      //   gl.enable(gl.DEPTH_TEST);
      //   gl.viewport(0, 0, 800, 800);
      //   gl.clearColor(0.8, 0.8, 0.8, 1.0);
      //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // }

      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);

    }

    if (window.isAnimating) {
      const date = new Date();
    }

    system.process(expression);

    count++;

    requestAnimationFrame(draw);
  };

  draw();

};


document.body.onload = load;

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  return entity;
}

function renderPassHelperForPostEffect(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
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

  if (renderPassHelperForPostEffect.cameraComponent == null) {
    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
    cameraComponent.zFarInner = 1.0;
    renderPassHelperForPostEffect.cameraComponent = cameraComponent;
  }

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
  renderPass.cameraComponent = renderPassHelperForPostEffect.cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
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

