import CameraComponent from '../../../dist/esm/foundation/components/CameraComponent';
import _Rn, {Material} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  const VRMImporter = Rn.VRMImporter.getInstance();
  const entityRepository = Rn.EntityRepository.getInstance();

  // params
  const rootGroupScale = Rn.Vector3.fromCopyArray([1, 1, 1]);

  const displayResolution = 800;

  // setting cameras except for post effect
  const mainCameraComponent = createCameraComponent();
  mainCameraComponent.zNear = 0.1;
  mainCameraComponent.zFar = 1000.0;
  mainCameraComponent.setFovyAndChangeFocalLength(25.0);
  mainCameraComponent.aspect = 1.0;
  // mainCameraComponent.zFarInner = 3000.0;

  const renderPassMain =
    renderPassHelperSetCameraComponent(mainCameraComponent);
  const framebufferMain = createFramebuffer(
    renderPassMain,
    2 * displayResolution,
    2 * displayResolution,
    1,
    {}
  );

  const postEffectCameraEntity = createPostEffectCameraEntity();
  const postEffectCameraComponent = postEffectCameraEntity.getCamera();

  const gammaCorrectionMaterial =
    Rn.MaterialHelper.createGammaCorrectionMaterial();
  const gammaCorrectionRenderPass = createPostEffectRenderPass(
    gammaCorrectionMaterial,
    postEffectCameraComponent
  );

  setTextureParameterForMeshComponents(
    gammaCorrectionRenderPass.meshComponents,
    Rn.ShaderSemantics.BaseColorTexture,
    framebufferMain.colorAttachments[0]
  );
  const framebufferGamma = createFramebuffer(
    gammaCorrectionRenderPass,
    displayResolution,
    displayResolution,
    1,
    {}
  );

  const fxaaMaterial = Rn.MaterialHelper.createFXAA3QualityMaterial();
  const fxaaRenderPass = createPostEffectRenderPass(
    fxaaMaterial,
    postEffectCameraComponent
  );

  setParameterForMeshComponents(
    fxaaRenderPass.meshComponents,
    Rn.ShaderSemantics.ScreenInfo,
    Rn.Vector2.fromCopyArray2([displayResolution, displayResolution])
  );
  setTextureParameterForMeshComponents(
    fxaaRenderPass.meshComponents,
    Rn.ShaderSemantics.BaseColorTexture,
    framebufferGamma.colorAttachments[0]
  );

  const expression = new Rn.Expression();
  expression.addRenderPasses([
    renderPassMain,
    gammaCorrectionRenderPass,
    fxaaRenderPass,
  ]);

  // rootGroups[0]: main entity, rootGroups[1]: outline entity(if exist)
  const rootGroups = await VRMImporter.import(
    './../../../assets/vrm/test.vrm',
    {
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: true,
          isSkinning: false,
          isMorphing: false,
          makeOutputSrgb: false,
        },
      ],
      // autoResizeTexture: true
    }
  );

  for (const rootGroup of rootGroups) {
    rootGroup.getTransform().scale = rootGroupScale;
    rootGroup.getTransform().rotate = Rn.Vector3.fromCopyArray([
      0.0,
      Math.PI,
      0.0,
    ]);
  }

  renderPassMain.addEntities(rootGroups);

  // Env Cube
  const sphereEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
    Rn.MeshRendererComponent,
  ]);
  const spherePrimitive = new Rn.Sphere();
  window.sphereEntity = sphereEntity;
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad =
    './../../../assets/ibl/shanghai_bund/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture
  );
  spherePrimitive.generate({
    radius: -50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  const sphereMeshComponent = sphereEntity.getMesh();
  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);
  sphereMeshComponent.setMesh(sphereMesh);
  sphereEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0, 20, -20,
  ]);

  renderPassMain.addEntities([sphereEntity]);

  // Lights
  const lightEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.LightComponent,
  ]);
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    0.0,
    0.0,
    Math.PI / 8,
  ]);

  // CameraControllerComponent
  const mainCameraEntityUID = mainCameraComponent.entityUID;
  entityRepository.addComponentsToEntity(
    [Rn.CameraControllerComponent],
    mainCameraEntityUID
  );

  const mainCameraEntity = mainCameraComponent.entity;
  const cameraControllerComponent = mainCameraEntity.getCameraController();
  cameraControllerComponent.controller.setTarget(rootGroups[0]);

  Rn.CameraComponent.main = 0;
  const startTime = Date.now();
  // const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const rot = 0;

  const draw = function () {
    if (p == null && count > 0) {
      if (rootGroups[0] != null) {
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 800, 800);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
    }

    system.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};

function rotEnv(rot) {
  for (const meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.rotationOfCubeMap = rot;
  }
  // window.sphere2MeshRendererComponent.rotationOfCubeMap = rot;
  window.sphereEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    0,
    -rot,
    0,
  ]);
}

function setDiffuseCubeMapContribution(value) {
  for (const meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.diffuseCubeMapContribution = value;
  }
}

function setSpecularCubeMapContribution(value) {
  for (const meshRendererComponent of window.meshRendererComponents) {
    meshRendererComponent.specularCubeMapContribution = value;
  }
}

function setAnisotropy(baseAnisotropy, clearcoatAnisotropy) {
  const materials = Rn.Material.getAllMaterials();
  for (const material of materials) {
    material.setParameter(
      Rn.ShaderSemantics.Anisotropy,
      Rn.Vector2.fromCopyArray2([baseAnisotropy, clearcoatAnisotropy])
    );
  }
}

function setClearCoat(factor, roughness) {
  const materials = Rn.Material.getAllMaterials();
  for (const material of materials) {
    material.setParameter(
      Rn.ShaderSemantics.ClearCoatParameter,
      Rn.Vector2.fromCopyArray2([factor, roughness])
    );
  }
}

function setSheen(sheenColor, sheenSubsurfaceColor) {
  const materials = Rn.Material.getAllMaterials();
  for (const material of materials) {
    material.setParameter(
      Rn.ShaderSemantics.SheenParameter,
      Rn.Vector2.fromCopyArray2([sheenColor, sheenSubsurfaceColor])
    );
  }
}

function arrayDifference(arrayWholeSet, arraySubset) {
  const result = arrayWholeSet.slice();
  for (let i = 0; i < arraySubset.length; i++) {
    const deleteIndex = result.indexOf(arraySubset[i]);
    result.splice(deleteIndex, 1);
  }
  return result;
}

function createCameraComponent() {
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  return cameraComponent;
}

function createFramebuffer(renderPass, width, height, textureNum, property) {
  const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
    width,
    height,
    textureNum,
    property
  );
  renderPass.setFramebuffer(framebuffer);
  return framebuffer;
}

function materialHelperForMeshComponents(
  meshComponents,
  materialHelperFunctionStr,
  argumentsArray
) {
  for (const meshComponent of meshComponents) {
    const mesh = meshComponent.mesh;
    for (let i = 0; i < mesh.getPrimitiveNumber(); i++) {
      const primitive = mesh.getPrimitiveAt(i);
      primitive.material = Rn.MaterialHelper[materialHelperFunctionStr].apply(
        this,
        argumentsArray
      );
    }
  }
}

function createPostEffectRenderPass(
  material: Material,
  cameraComponent: CameraComponent
) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);

  const boardEntity = generateEntity();
  boardEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0.0,
    0.0,
  ]);
  boardEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0.0, -0.5,
  ]);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function createPostEffectCameraEntity() {
  const cameraEntity = generateEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;
  return cameraEntity;
}

function generateEntity(
  componentArray = [
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
    Rn.MeshRendererComponent,
  ] as Array<typeof Rn.Component>
) {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity(componentArray);
  return entity;
}

function renderPassHelperSetCameraComponent(cameraComponent) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;

  return renderPass;
}

function setParameterForMeshComponents(meshComponents, shaderSemantic, value) {
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    const primitiveNumber = mesh.getPrimitiveNumber();

    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setParameter(shaderSemantic, value);
    }
  }
}

function setTextureParameterForMeshComponents(
  meshComponents,
  shaderSemantic,
  value
) {
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
