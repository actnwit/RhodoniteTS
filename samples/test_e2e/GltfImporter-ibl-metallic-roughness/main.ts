import _Rn, {MeshRendererComponent} from '../../../dist/esm/index';
import {
  OrbitCameraController,
  CameraComponent,
  MeshComponent,
  EntityRepository,
  AbstractTexture,
  Expression,
  FrameBuffer,
  RenderPass,
} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  Rn.Config.maxSkeletalBoneNumber = 50; // avoiding too many uniforms error for software renderer
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  // expressions
  const expressions = [];

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const mainExpression = await gltfImporter.import(
    '../../../assets/gltf/2.0/MetalRoughSpheresNoTextures/glTF/MetalRoughSpheresNoTextures.gltf',
    {
      cameraComponent: cameraComponent,
    }
  );
  expressions.push(mainExpression);

  // post effects
  const expressionPostEffect = new Rn.Expression();
  expressions.push(expressionPostEffect);

  // gamma correction
  const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
    600,
    600,
    1,
    {}
  );
  for (const renderPass of mainExpression.renderPasses) {
    renderPass.setFramebuffer(gammaTargetFramebuffer);
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
  }
  mainExpression.renderPasses[0].toClearColorBuffer = true;
  mainExpression.renderPasses[0].toClearDepthBuffer = true;

  const gammaRenderPass = createPostEffectRenderPass(
    'createGammaCorrectionMaterial'
  );
  setTextureParameterForMeshComponents(
    gammaRenderPass.meshComponents,
    Rn.ShaderSemantics.BaseColorTexture,
    gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
  );

  expressionPostEffect.addRenderPasses([gammaRenderPass]);

  // cameraController
  const mainRenderPass = mainExpression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller = mainCameraControllerComponent.controller as OrbitCameraController;
  controller.dolly = 0.79;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

  // lighting
  setIBL('./../../../assets/ibl/papermill');

  let count = 0;

  const draw = function () {
    if (count > 100) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    }

    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

function createEnvCubeExpression(baseuri) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseuri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture
  );

  const spherePrimitive = new Rn.Sphere();
  spherePrimitive.generate({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);

  const entityRepository = Rn.EntityRepository.getInstance();
  const sphereEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
    Rn.MeshRendererComponent,
  ]);
  sphereEntity.getTransform().scale = new Rn.Vector3(-1, 1, 1);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

function setIBL(baseUri) {
  const specularCubeTexture = new Rn.CubeTexture();
  specularCubeTexture.baseUriToLoad = baseUri + '/specular/specular';
  specularCubeTexture.isNamePosNeg = true;
  specularCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  specularCubeTexture.mipmapLevelNumber = 10;

  const diffuseCubeTexture = new Rn.CubeTexture();
  diffuseCubeTexture.baseUriToLoad = baseUri + '/diffuse/diffuse';
  diffuseCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  diffuseCubeTexture.mipmapLevelNumber = 1;
  diffuseCubeTexture.isNamePosNeg = true;

  const componentRepository = Rn.ComponentRepository.getInstance();
  const meshRendererComponents = componentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as MeshRendererComponent[];
  for (let i = 0; i < meshRendererComponents.length; i++) {
    const meshRendererComponent = meshRendererComponents[i];
    meshRendererComponent.specularCubeMap = specularCubeTexture;
    meshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
  }
}

let postEffectRenderPassCameraComponent: CameraComponent;
function createPostEffectRenderPass(
  materialHelperFunctionStr,
  arrayOfHelperFunctionArgument = []
) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material: Rn.MaterialHelper[materialHelperFunctionStr].apply(
      this,
      arrayOfHelperFunctionArgument
    ),
  });

  const boardEntity = generateEntity();
  boardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);
  boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  if (postEffectRenderPassCameraComponent == null) {
    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([
      Rn.TransformComponent,
      Rn.SceneGraphComponent,
      Rn.CameraComponent,
    ]);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zFarInner = 1.0;
    postEffectRenderPassCameraComponent = cameraComponent;
  }

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
  renderPass.cameraComponent = postEffectRenderPassCameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
    Rn.MeshRendererComponent,
  ]);
  return entity;
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
