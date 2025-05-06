import Rn from '../../../dist/esmdev/index.js';
import { PointShadowMap } from './PointShadowMap.js';
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
pointLight.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
pointLight.getLight().intensity = 20;
pointLight.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
const pointGroupEntity = Rn.createGroupEntity();
pointGroupEntity.addChild(pointLight.getSceneGraph());
pointGroupEntity.localPosition = Rn.Vector3.fromCopyArray([2, 0, 2]);
pointLight.localPosition = Rn.Vector3.fromCopyArray([2, 0, 0]);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

// Scene
const groupEntity = createObjects();
mainCameraEntity.getCameraController().controller.setTarget(groupEntity);
const backgroundEntity = createBackground();

// Expression
const [pointShadowMapArrayFramebuffer, pointShadowMapArrayRenderTargetTexture] =
  Rn.RenderableHelper.createFrameBufferTextureArray({
    width: 1024,
    height: 1024,
    arrayLength: 1,
    level: 0,
    internalFormat: Rn.TextureFormat.RGBA16F,
    format: Rn.PixelFormat.RGBA,
    type: Rn.ComponentType.Float,
  });
const shadowMapExpression = new Rn.Expression();
const pointShadowMap = new PointShadowMap();
const renderPasses = pointShadowMap.getRenderPasses([groupEntity, backgroundEntity]);
shadowMapExpression.addRenderPasses(renderPasses);
const gaussianBlur = new Rn.GaussianBlur();
const { blurExpression, blurredRenderTarget, renderPassesBlurred } =
  gaussianBlur.createGaussianBlurExpression({
    textureToBlur: pointShadowMap
      .getShadowMomentFramebuffer()
      .getColorAttachedRenderTargetTexture(0)!,
    parameters: {
      blurPassLevel: 4,
      gaussianKernelSize: 10,
      gaussianVariance: 10,
      synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
      isReduceBuffer: false,
      outputFrameBuffer: pointShadowMapArrayFramebuffer,
      outputFrameBufferLayerIndex: 0,
    },
  });

const mainExpression = new Rn.Expression();
const mainRenderPass = new Rn.RenderPass();
mainRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.addEntities([groupEntity, backgroundEntity, pointLight]);
setParaboloidBlurredShadowMap(blurredRenderTarget, [groupEntity, backgroundEntity]);
// setParaboloidBlurredShadowMap(
//   renderPassesBlurred[9].getFramebuffer()!.getColorAttachedRenderTargetTexture(0)!,
//   [groupEntity, backgroundEntity]
// );
// setParaboloidBlurredShadowMap(shadowMomentFramebuffer.getColorAttachedRenderTargetTexture(0), [
//   groupEntity,
//   backgroundEntity,
// ]);
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
