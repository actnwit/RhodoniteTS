import type { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { LightComponent } from '../../components/Light/LightComponent';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import { ComponentType } from '../../definitions/ComponentType';
import { LightType, type LightTypeEnum } from '../../definitions/LightType';
import { PixelFormat } from '../../definitions/PixelFormat';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import { VectorN } from '../../math/VectorN';
import { Expression } from '../../renderer/Expression';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import type { Engine } from '../../system/Engine';
import type { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { Sampler } from '../../textures/Sampler';
import type { ISceneGraphEntity } from '../EntityHelper';
import { GaussianBlur } from '../GaussianBlurHelper';
import { RenderableHelper } from '../RenderableHelper';
import { PointShadowMap } from './PointShadowMap';
import { ShadowMap } from './ShadowMap';

/**
 * A system for managing shadow mapping operations in the rendering pipeline.
 * Handles both directional/spot light shadows and point light shadows with Gaussian blur post-processing.
 */
export class ShadowSystem {
  private __engine: Engine;
  private __shadowMap: ShadowMap;
  private __pointShadowMap: PointShadowMap;
  private __gaussianBlur: GaussianBlur;
  private __shadowMapArrayFramebuffer: FrameBuffer;
  private __pointShadowMapArrayFramebuffer: FrameBuffer;
  private __lightTypes: LightTypeEnum[] = [];
  private __lightEnables: boolean[] = [];
  private __lightCastShadows: boolean[] = [];

  /**
   * Creates a new ShadowSystem instance with the specified shadow map resolution.
   * Initializes shadow map and point shadow map systems, along with framebuffers for texture arrays.
   * @param shadowMapSize - The resolution (width and height) of shadow maps in pixels
   */
  constructor(engine: Engine, shadowMapSize: number) {
    this.__engine = engine;
    this.__shadowMap = new ShadowMap(engine);
    this.__pointShadowMap = new PointShadowMap(engine);
    this.__gaussianBlur = new GaussianBlur(engine);

    const [shadowMapArrayFramebuffer, _shadowMapArrayRenderTargetTexture] =
      RenderableHelper.createFrameBufferTextureArray(engine, {
        width: shadowMapSize,
        height: shadowMapSize,
        arrayLength: Config.maxLightNumber,
        level: 0,
        internalFormat: TextureFormat.RG16F,
        format: PixelFormat.RG,
        type: ComponentType.Float,
      });
    this.__shadowMapArrayFramebuffer = shadowMapArrayFramebuffer;

    const [pointShadowMapArrayFramebuffer, _pointShadowMapArrayRenderTargetTexture] =
      RenderableHelper.createFrameBufferTextureArray(engine, {
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

  /**
   * Generates rendering expressions for shadow mapping based on the provided entities and active lights.
   * Creates shadow map render passes for each shadow-casting light and applies Gaussian blur post-processing.
   * @param entities - Array of scene graph entities to be rendered for shadow mapping
   * @returns Array of Expression objects containing the shadow mapping render passes
   */
  public getExpressions(entities: ISceneGraphEntity[]) {
    const expressions = [];
    const depthTextureIndexList = [];

    let depthTextureCount = 0;
    let pointDepthTextureCount = 0;
    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
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
          renderPassesBlurred: _renderPassesBlurredPointLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__pointShadowMap.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0)!,
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
      } else if (lightComponent.type === LightType.Spot || lightComponent.type === LightType.Directional) {
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
          renderPassesBlurred: _renderPassesBlurredSpotLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__shadowMap.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0)!,
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

  /**
   * Sets the blurred shadow map texture for directional and spot lights on all entity materials.
   * Creates a linear sampler and assigns the shadow map texture to the 'depthTexture' parameter.
   * @param blurredRenderTarget - The blurred shadow map render target texture
   * @param entities - Array of scene graph entities to apply the shadow map to
   * @private
   */
  private __setBlurredShadowMap(blurredRenderTarget: RenderTargetTexture, entities: ISceneGraphEntity[]) {
    const sampler = new Sampler(this.__engine, {
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

  /**
   * Sets the blurred paraboloid shadow map texture for point lights on all entity materials.
   * Creates a linear sampler and assigns the shadow map texture to the 'paraboloidDepthTexture' parameter.
   * Also sets the UV scale parameter for point light shadow mapping.
   * @param blurredRenderTarget - The blurred paraboloid shadow map render target texture
   * @param entities - Array of scene graph entities to apply the shadow map to
   * @private
   */
  private __setParaboloidBlurredShadowMap(blurredRenderTarget: RenderTargetTexture, entities: ISceneGraphEntity[]) {
    const sampler = new Sampler(this.__engine, {
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
          primitive.material.setTextureParameter('paraboloidDepthTexture', blurredRenderTarget, sampler);
          primitive.material.setParameter('pointLightShadowMapUvScale', 0.93);
        }
      }
    }
  }

  /**
   * Sets the depth texture index list parameter on all entity materials.
   * This parameter maps each light to its corresponding shadow map texture index.
   * @param entities - Array of scene graph entities to apply the index list to
   * @param depthTextureIndexList - Array of indices mapping lights to shadow map textures (-1 for no shadow)
   * @private
   */
  private __setDepthTextureIndexList(entities: ISceneGraphEntity[], depthTextureIndexList: number[]) {
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter('depthTextureIndexList', new VectorN(new Int32Array(depthTextureIndexList)));
        }
      }
    }
  }

  /**
   * Sets the depth bias projection-view matrices for shadow mapping on all PBR materials.
   * Calculates and applies bias matrices for directional and spot lights to reduce shadow acne.
   * @param entities - Array of scene graph entities to apply the bias matrices to
   */
  public setDepthBiasPV(entities: ISceneGraphEntity[]) {
    const float32Array = new Float32Array(Config.maxLightNumber * 16);

    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      const lightEntity = lightComponent.entity as ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods;
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

  /**
   * Checks if the light configuration has changed since the last update.
   * Compares the current light types, enable states, and shadow casting states with cached values.
   * @returns True if any light has changed its type, enable state, or shadow casting state; false otherwise
   */
  public isLightChanged() {
    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

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
