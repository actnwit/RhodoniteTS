import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(90.0);
cameraComponent.aspect = 1.0;

const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  ),
  environment: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  specular: Rn.CubeTexture.loadFromUrl({
    baseUrl: './../../../assets/ibl/papermill/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

// expressions
const expressions = [];

expressions.push(assets.mainExpression);

// env
const envExpression = await createEnvCubeExpression();
expressions.push(envExpression);

// post effects
const expressionPostEffect = new Rn.Expression();
expressions.push(expressionPostEffect);

// gamma correction
const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
for (const renderPass of assets.mainExpression.renderPasses) {
  renderPass.setFramebuffer(gammaTargetFramebuffer);
  renderPass.toClearColorBuffer = false;
  renderPass.toClearDepthBuffer = false;
}
assets.mainExpression.renderPasses[0].toClearColorBuffer = true;
assets.mainExpression.renderPasses[0].toClearDepthBuffer = true;
assets.mainExpression.renderPasses[0].clearColor = Rn.Vector4.fromCopyArray([0, 0, 0, 0]);

const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial(engine);
gammaCorrectionMaterial.alphaMode = Rn.AlphaMode.Blend;

const gammaCorrectionRenderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  engine,
  gammaCorrectionMaterial,
  gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
);
expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass]);

// cameraController
const mainRenderPass = assets.mainExpression.renderPasses[0];
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.78;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

// lighting
await setIBL();

let count = 0;

engine.startRenderLoop(() => {
  switch (count) {
    case 1:
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      break;
    case 100:
      p.setAttribute('id', 'moved');
      p.innerText = 'Moved.';
      break;
  }

  engine.process(expressions);
  count++;
});

async function createEnvCubeExpression() {
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial(engine);
  const sampler = new Rn.Sampler({
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', assets.environment, sampler);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);

  const spherePrimitive = new Rn.Sphere(engine);
  spherePrimitive.generate({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh(engine);
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.createMeshEntity(engine);
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass(engine);
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

async function setIBL() {
  const meshRendererComponents = engine.componentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
