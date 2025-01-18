import { PointShadowMap } from './PointShadowMap.js';
import { ShadowMap } from './ShadowMap.js';
import Rn from '../../../dist/esmdev/index.js';

export class ShadowSystem {
  private __shadowMap: ShadowMap;
  private __pointShadowMap: PointShadowMap;
  private __gaussianBlur: Rn.GaussianBlur;
  private __shadowMapArrayFramebuffer: Rn.FrameBuffer;
  private __pointShadowMapArrayFramebuffer: Rn.FrameBuffer;

  constructor() {
    this.__shadowMap = new ShadowMap();
    this.__pointShadowMap = new PointShadowMap();
    this.__gaussianBlur = new Rn.GaussianBlur();

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
    this.__shadowMapArrayFramebuffer = shadowMapArrayFramebuffer;

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
    this.__pointShadowMapArrayFramebuffer = pointShadowMapArrayFramebuffer;
  }

  public getExpressions(entities: Rn.ISceneGraphEntity[]) {
    const expressions = [];
    const shadowMapExpression = new Rn.Expression();
    expressions.push(shadowMapExpression);
    const depthTextureIndexList = [];

    let depthTextureCount = 0;
    let pointDepthTextureCount = 0;
    const lightComponents = Rn.ComponentRepository.getComponentsWithType(
      Rn.LightComponent
    ) as Rn.LightComponent[];
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];

      if (!(lightComponent.enable && lightComponent.castShadow)) {
        depthTextureIndexList.push(-1);
        continue;
      }

      if (lightComponent.type === Rn.LightType.Point) {
        shadowMapExpression.addRenderPasses(this.__pointShadowMap.getRenderPasses(entities));
        const {
          blurExpression: blurExpressionPointLight,
          blurredRenderTarget: blurredRenderTargetPointLight,
          renderPassesBlurred: renderPassesBlurredPointLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__pointShadowMap
            .getShadowMomentFramebuffer()
            .getColorAttachedRenderTargetTexture(0)!,
          parameters: {
            blurPassLevel: 4,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
            isReduceBuffer: false,
            textureFormat: Rn.TextureFormat.RGBA16F,
            outputFrameBuffer: this.__pointShadowMapArrayFramebuffer,
            outputFrameBufferLayerIndex: pointDepthTextureCount,
          },
        });
        this.__setParaboloidBlurredShadowMap(blurredRenderTargetPointLight, entities);
        expressions.push(blurExpressionPointLight);
        depthTextureIndexList.push(pointDepthTextureCount);
        pointDepthTextureCount++;
      } else if (
        lightComponent.type === Rn.LightType.Spot ||
        lightComponent.type === Rn.LightType.Directional
      ) {
        shadowMapExpression.addRenderPasses(
          this.__shadowMap.getRenderPasses(
            entities,
            lightComponent.entity as Rn.ISceneGraphEntity &
              Rn.ILightEntityMethods &
              Rn.ICameraEntityMethods
          )
        );
        const {
          blurExpression: blurExpressionSpotLight,
          blurredRenderTarget: blurredRenderTargetSpotLight,
          renderPassesBlurred: renderPassesBlurredSpotLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__shadowMap
            .getShadowMomentFramebuffer()
            .getColorAttachedRenderTargetTexture(0)!,
          parameters: {
            blurPassLevel: 4,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5, 1.0 / 5],
            isReduceBuffer: true,
            textureFormat: Rn.TextureFormat.RG16F,
            outputFrameBuffer: this.__shadowMapArrayFramebuffer,
            outputFrameBufferLayerIndex: depthTextureCount,
          },
        });
        this.__setBlurredShadowMap(blurredRenderTargetSpotLight, entities);
        expressions.push(blurExpressionSpotLight);
        depthTextureIndexList.push(depthTextureCount);
        depthTextureCount++;
      } else {
        depthTextureIndexList.push(-1);
      }
    }

    this.__setDepthTextureIndexList(entities, depthTextureIndexList);

    return expressions;
  }

  private __setBlurredShadowMap(
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

  private __setParaboloidBlurredShadowMap(
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

  private __setDepthTextureIndexList(
    entities: Rn.ISceneGraphEntity[],
    depthTextureIndexList: number[]
  ) {
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter(
            'depthTextureIndexList',
            new Rn.VectorN(new Int32Array(depthTextureIndexList))
          );
        }
      }
    }
  }

  public setDepthBiasPV(
    lightEntity: Rn.ISceneGraphEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods,
    entities: Rn.ISceneGraphEntity[]
  ) {
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter(
            'depthBiasPV',
            lightEntity.getCamera().biasViewProjectionMatrix
          );
        }
      }
    }
  }
}
