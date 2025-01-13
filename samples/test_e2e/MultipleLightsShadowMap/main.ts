import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
Rn.Logger.logLevel = Rn.LogLevel.Debug;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Point Light
let pointLight = Rn.MeshHelper.createSphere() as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  pointLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight.getLight().type = Rn.LightType.Point;
pointLight.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
const pointGroupEntity = Rn.createGroupEntity();
pointGroupEntity.addChild(pointLight.getSceneGraph());
pointGroupEntity.localPosition = Rn.Vector3.fromCopyArray([2, 0, 2]);
pointLight.localPosition = Rn.Vector3.fromCopyArray([2, 0, 0]);

// Spot Light
let spotLight = Rn.MeshHelper.createSphere() as Rn.IMeshEntity &
  Rn.ILightEntityMethods &
  Rn.ICameraEntityMethods;
spotLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  spotLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.CameraComponentTID,
  spotLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight.getCamera().isSyncToLight = true;

spotLight.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
spotLight.getLight().type = Rn.LightType.Spot;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 6.0, 0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

// Scene
const groupEntity = createObjects();
mainCameraEntity.getCameraController().controller.setTarget(groupEntity);
const backgroundEntity = createBackground();

// Expression
const shadowMapExpression = new Rn.Expression();
const shadowMomentFramebuffer = setupPointLightShadowMapRenderPasses(shadowMapExpression, [
  groupEntity,
  backgroundEntity,
]);
const { blurExpression, blurredRenderTarget, renderPassesBlurred } =
  Rn.GaussianBlurHelper.createGaussianBlurExpression({
    textureToBlur: shadowMomentFramebuffer.getColorAttachedRenderTargetTexture(0)!,
    parameters: {
      blurPassLevel: 4,
      gaussianKernelSize: 10,
      gaussianVariance: 10,
      synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
      isReduceBuffer: false,
    },
  });

const mainExpression = new Rn.Expression();
const mainRenderPass = new Rn.RenderPass();
mainRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.cameraComponent = mainCameraEntity.getCamera();
mainRenderPass.addEntities([groupEntity, backgroundEntity, pointLight, spotLight]);
setParaboloidBlurredShadowMap(blurredRenderTarget, [groupEntity, backgroundEntity]);
mainExpression.addRenderPasses([mainRenderPass]);

let count = 0;
let angle = 0;
Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  if (window.isAnimating) {
    rotateObject(pointGroupEntity, angle);
    angle += 0.01;
  }
  Rn.System.process([shadowMapExpression, blurExpression, mainExpression]);
  // Rn.System.process([shadowMapExpression, mainExpression]);

  count++;
});

function setParaboloidBlurredShadowMap(
  blurredRenderTarget: Rn.RenderTargetTexture,
  entities: Rn.ISceneGraphEntity[]
) {
  const sampler = new Rn.Sampler({
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sampler.create();

  for (const entity of entities) {
    const meshComponent = entity.tryToGetMesh();
    if (meshComponent != null && meshComponent.mesh != null) {
      for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
        const primitive = meshComponent.mesh.getPrimitiveAt(i);
        primitive.material.setTextureParameter(
          'paraboloidDepthTexture',
          blurredRenderTarget,
          sampler
        );
      }
    }
  }
}

function setupSpotLightShadowMapRenderPasses(
  shadowMapExpression: Rn.Expression,
  entities: Rn.ISceneGraphEntity[]
) {
  const shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: 1024,
    height: 1024,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA16F],
    createDepthBuffer: true,
    depthTextureFormat: Rn.TextureFormat.Depth32F,
  });
}

function setupPointLightShadowMapRenderPasses(
  shadowMapExpression: Rn.Expression,
  entities: Rn.ISceneGraphEntity[]
) {
  const shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
    width: 1024,
    height: 1024,
    textureNum: 1,
    textureFormats: [Rn.TextureFormat.RGBA16F],
    createDepthBuffer: true,
    depthTextureFormat: Rn.TextureFormat.Depth32F,
  });
  const shadowMomentFrontMaterial = Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
  shadowMomentFrontMaterial.colorWriteMask = [true, true, false, false];
  shadowMomentFrontMaterial.cullFace = false;
  const shadowMomentFrontRenderPass = new Rn.RenderPass();
  shadowMomentFrontRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
  shadowMomentFrontRenderPass.toClearColorBuffer = true;
  shadowMomentFrontRenderPass.toClearDepthBuffer = true;
  shadowMomentFrontRenderPass.addEntities(entities);
  shadowMomentFrontRenderPass.setFramebuffer(shadowMomentFramebuffer);
  shadowMomentFrontRenderPass.setMaterial(shadowMomentFrontMaterial);
  shadowMapExpression.addRenderPasses([shadowMomentFrontRenderPass]);

  const shadowMomentBackMaterial = Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
  shadowMomentBackMaterial.colorWriteMask = [false, false, true, true];
  shadowMomentBackMaterial.setParameter('frontHemisphere', false);
  const shadowMomentBackRenderPass = new Rn.RenderPass();
  shadowMomentBackRenderPass.toClearColorBuffer = false;
  shadowMomentBackRenderPass.toClearDepthBuffer = true;
  shadowMomentBackRenderPass.addEntities(entities);
  shadowMomentBackRenderPass.setFramebuffer(shadowMomentFramebuffer);
  shadowMomentBackRenderPass.setMaterial(shadowMomentBackMaterial);
  shadowMapExpression.addRenderPasses([shadowMomentBackRenderPass]);

  return shadowMomentFramebuffer;
}

function createObjects() {
  const material = Rn.MaterialHelper.createPbrUberMaterial({ isShadow: true });
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1, 0, 0, 1]));
  const cubesGroupEntity = Rn.createGroupEntity();
  const cube0Entity = Rn.MeshHelper.createCube({ material });
  cube0Entity.localPosition = Rn.Vector3.fromCopyArray([2, 0, 2]);
  const cube1Entity = Rn.MeshHelper.createCube({ material });
  cube1Entity.localPosition = Rn.Vector3.fromCopyArray([-2, 0, 2]);
  const cube2Entity = Rn.MeshHelper.createSphere({
    widthSegments: 40,
    heightSegments: 40,
    material,
  });
  cube2Entity.localPosition = Rn.Vector3.fromCopyArray([2, 0, -2]);
  const cube3Entity = Rn.MeshHelper.createSphere({
    widthSegments: 40,
    heightSegments: 40,
    material,
  });
  cube3Entity.localPosition = Rn.Vector3.fromCopyArray([-2, 0, -2]);
  cubesGroupEntity.addChild(cube0Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube1Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube2Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube3Entity.getSceneGraph());

  return cubesGroupEntity;
}

function createBackground() {
  const material = Rn.MaterialHelper.createPbrUberMaterial({ isShadow: true });
  material.cullFaceBack = false;
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1.0, 1.0, 1.0, 1]));
  const backgroundEntity = Rn.MeshHelper.createSphere({
    widthSegments: 50,
    heightSegments: 50,
    material,
  });
  backgroundEntity.scale = Rn.Vector3.fromCopyArray([10, 10, 10]);
  return backgroundEntity;
}

function rotateObject(object: Rn.ISceneGraphEntity, angle: number) {
  object.localEulerAngles = Rn.Vector3.fromCopyArray([0, angle, 0]);
}
