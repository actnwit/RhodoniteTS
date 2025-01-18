import Rn from '../../../dist/esmdev/index.js';
import { PointShadowMap } from './PointShadowMap.js';
import { ShadowMap } from './ShadowMap.js';

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
spotLight.getLight().range = 1000.0;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 6.0, 0.0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

// Scene
const groupEntity = createObjects();
mainCameraEntity.getCameraController().controller.setTarget(groupEntity);
const backgroundEntity = createBackground();

// Expression
const shadowMapExpression = new Rn.Expression();

// SpotLight shadow map pass
const [shadowMapArrayFramebuffer, shadowMapArrayRenderTargetTexture] =
  Rn.RenderableHelper.createFrameBufferTextureArray({
    width: 1024,
    height: 1024,
    arrayLength: 1,
    level: 0,
    internalFormat: Rn.TextureFormat.RG16F,
    format: Rn.PixelFormat.RG,
    type: Rn.ComponentType.Float,
  });
const shadowMap = new ShadowMap();
shadowMapExpression.addRenderPasses(
  shadowMap.getRenderPasses([groupEntity, backgroundEntity], spotLight)
);

const gaussianBlur = new Rn.GaussianBlur();
const {
  blurExpression: blurExpressionSpotLight,
  blurredRenderTarget: blurredRenderTargetSpotLight,
  renderPassesBlurred: renderPassesBlurredSpotLight,
} = gaussianBlur.createGaussianBlurExpression({
  textureToBlur: shadowMap.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0)!,
  parameters: {
    blurPassLevel: 4,
    gaussianKernelSize: 5,
    gaussianVariance: 5,
    synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
    isReduceBuffer: true,
    textureFormat: Rn.TextureFormat.RG16F,
    outputFrameBuffer: shadowMapArrayFramebuffer,
    outputFrameBufferLayerIndex: 0,
  },
});

// PointLight shadow map passes
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

const pointShadowMap = new PointShadowMap();
shadowMapExpression.addRenderPasses(
  pointShadowMap.getRenderPasses([groupEntity, backgroundEntity])
);
const {
  blurExpression: blurExpressionPointLight,
  blurredRenderTarget: blurredRenderTargetPointLight,
  renderPassesBlurred: renderPassesBlurredPointLight,
} = gaussianBlur.createGaussianBlurExpression({
  textureToBlur: pointShadowMap
    .getShadowMomentFramebuffer()
    .getColorAttachedRenderTargetTexture(0)!,
  parameters: {
    blurPassLevel: 4,
    gaussianKernelSize: 5,
    gaussianVariance: 5,
    synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
    isReduceBuffer: false,
    textureFormat: Rn.TextureFormat.RGBA16F,
    outputFrameBuffer: pointShadowMapArrayFramebuffer,
    outputFrameBufferLayerIndex: 0,
  },
});

const mainExpression = new Rn.Expression();
const mainRenderPass = new Rn.RenderPass();
mainRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.cameraComponent = mainCameraEntity.getCamera();
mainRenderPass.addEntities([groupEntity, backgroundEntity, pointLight, spotLight]);
setBlurredShadowMap(blurredRenderTargetSpotLight, [groupEntity, backgroundEntity]);
// setBlurredShadowMap(shadowMomentFramebufferSpotLight.getColorAttachedRenderTargetTexture(0)!, [
//   groupEntity,
//   backgroundEntity,
// ]);
setParaboloidBlurredShadowMap(blurredRenderTargetPointLight, [groupEntity, backgroundEntity]);
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
  setSpotLightDepthBiasPV(spotLight, [groupEntity, backgroundEntity]);
  Rn.System.process([
    shadowMapExpression,
    blurExpressionSpotLight,
    blurExpressionPointLight,
    mainExpression,
  ]);
  // Rn.System.process([shadowMapExpression, mainExpression]);

  count++;
});

function setSpotLightDepthBiasPV(
  spotLight: Rn.ISceneGraphEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods,
  entities: Rn.ISceneGraphEntity[]
) {
  for (const entity of entities) {
    const meshComponent = entity.tryToGetMesh();
    if (meshComponent != null && meshComponent.mesh != null) {
      for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
        const primitive = meshComponent.mesh.getPrimitiveAt(i);
        primitive.material.setParameter(
          'depthBiasPV',
          spotLight.getCamera().biasViewProjectionMatrix
        );
      }
    }
  }
}

function setBlurredShadowMap(
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
        primitive.material.setTextureParameter('depthTexture', blurredRenderTarget, sampler);
      }
    }
  }
}

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
        primitive.material.setParameter('pointLightShadowMapUvScale', 0.93);
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
