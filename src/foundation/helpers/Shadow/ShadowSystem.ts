import { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { LightComponent } from '../../components/Light/LightComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { ComponentType } from '../../definitions/ComponentType';
import { LightType, LightTypeEnum } from '../../definitions/LightType';
import { PixelFormat } from '../../definitions/PixelFormat';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import { VectorN } from '../../math/VectorN';
import { Expression } from '../../renderer/Expression';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { Sampler } from '../../textures/Sampler';
import { ISceneGraphEntity } from '../EntityHelper';
import { GaussianBlur } from '../GaussianBlurHelper';
import { RenderableHelper } from '../RenderableHelper';
import { PointShadowMap } from './PointShadowMap';
import { ShadowMap } from './ShadowMap';

export class ShadowSystem {
  private __shadowMap: ShadowMap;
  private __pointShadowMap: PointShadowMap;
  private __gaussianBlur: GaussianBlur;
  private __shadowMapArrayFramebuffer: FrameBuffer;
  private __pointShadowMapArrayFramebuffer: FrameBuffer;
  private __lightTypes: LightTypeEnum[] = [];
  private __lightEnables: boolean[] = [];
  private __lightCastShadows: boolean[] = [];

  constructor(shadowMapSize: number) {
    this.__shadowMap = new ShadowMap();
    this.__pointShadowMap = new PointShadowMap();
    this.__gaussianBlur = new GaussianBlur();

    const [shadowMapArrayFramebuffer, shadowMapArrayRenderTargetTexture] =
      RenderableHelper.createFrameBufferTextureArray({
        width: shadowMapSize,
        height: shadowMapSize,
        arrayLength: Config.maxLightNumber,
        level: 0,
        internalFormat: TextureFormat.RG16F,
        format: PixelFormat.RG,
        type: ComponentType.Float,
      });
    this.__shadowMapArrayFramebuffer = shadowMapArrayFramebuffer;

    const [pointShadowMapArrayFramebuffer, pointShadowMapArrayRenderTargetTexture] =
      RenderableHelper.createFrameBufferTextureArray({
        width: shadowMapSize,
        height: shadowMapSize,
        arrayLength: Config.maxLightNumber,
        level: 0,
        internalFormat: TextureFormat.RGBA16F,
        format: PixelFormat.RGBA,
        type: ComponentType.Float,
      });
    this.__pointShadowMapArrayFramebuffer = pointShadowMapArrayFramebuffer;
  }

  public getExpressions(entities: ISceneGraphEntity[]) {
    const expressions = [];
    const depthTextureIndexList = [];

    let depthTextureCount = 0;
    let pointDepthTextureCount = 0;
    const lightComponents = ComponentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      this.__lightTypes[i] = lightComponent.type;
      this.__lightEnables[i] = lightComponent.enable;
      this.__lightCastShadows[i] = lightComponent.castShadow;

      if (!(lightComponent.enable && lightComponent.castShadow)) {
        depthTextureIndexList.push(-1);
        continue;
      }

      if (lightComponent.type === LightType.Point) {
        const shadowMapExpression = new Expression();
        shadowMapExpression.addRenderPasses(
          this.__pointShadowMap.getRenderPasses(
            entities,
            lightComponent.entity as ISceneGraphEntity & ILightEntityMethods
          )
        );
        expressions.push(shadowMapExpression);
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
            textureFormat: TextureFormat.RGBA16F,
            outputFrameBuffer: this.__pointShadowMapArrayFramebuffer,
            outputFrameBufferLayerIndex: pointDepthTextureCount,
          },
        });
        this.__setParaboloidBlurredShadowMap(blurredRenderTargetPointLight, entities);
        expressions.push(blurExpressionPointLight);
        depthTextureIndexList.push(pointDepthTextureCount);
        pointDepthTextureCount++;
      } else if (
        lightComponent.type === LightType.Spot ||
        lightComponent.type === LightType.Directional
      ) {
        const shadowMapExpression = new Expression();
        shadowMapExpression.addRenderPasses(
          this.__shadowMap.getRenderPasses(
            entities,
            lightComponent.entity as ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods
          )
        );
        expressions.push(shadowMapExpression);
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
            textureFormat: TextureFormat.RG16F,
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
    blurredRenderTarget: RenderTargetTexture,
    entities: ISceneGraphEntity[]
  ) {
    const sampler = new Sampler({
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
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
    blurredRenderTarget: RenderTargetTexture,
    entities: ISceneGraphEntity[]
  ) {
    const sampler = new Sampler({
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
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
    entities: ISceneGraphEntity[],
    depthTextureIndexList: number[]
  ) {
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter(
            'depthTextureIndexList',
            new VectorN(new Int32Array(depthTextureIndexList))
          );
        }
      }
    }
  }

  public setDepthBiasPV(entities: ISceneGraphEntity[]) {
    const float32Array = new Float32Array(Config.maxLightNumber * 16);

    const lightComponents = ComponentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];

    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      const lightEntity = lightComponent.entity as ISceneGraphEntity &
        ILightEntityMethods &
        ICameraEntityMethods;
      if (lightComponent.type === LightType.Directional || lightComponent.type === LightType.Spot) {
        const cameraComponent = lightEntity.tryToGetCamera();
        if (cameraComponent != null) {
          const biasViewProjectionMatrix = cameraComponent.biasViewProjectionMatrix;
          float32Array.set(biasViewProjectionMatrix._v, i * 16);
        }
      }
    }

    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          if (primitive.material.__materialTypeName.includes('Pbr')) {
            primitive.material.setParameter('depthBiasPV', new VectorN(float32Array));
          }
        }
      }
    }
  }

  public isLightChanged() {
    const lightComponents = ComponentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];

    if (this.__lightTypes.length !== lightComponents.length) {
      return true;
    }

    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      if (
        this.__lightTypes[i] !== lightComponent.type ||
        this.__lightEnables[i] !== lightComponent.enable ||
        this.__lightCastShadows[i] !== lightComponent.castShadow
      ) {
        return true;
      }
    }
    return false;
  }
}
