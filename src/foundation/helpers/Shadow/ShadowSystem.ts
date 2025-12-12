import type { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { LightComponent } from '../../components/Light/LightComponent';
import { TransformComponent } from '../../components/Transform';
import { ComponentType } from '../../definitions/ComponentType';
import { LightType, type LightTypeEnum } from '../../definitions/LightType';
import { PixelFormat } from '../../definitions/PixelFormat';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import { AABB } from '../../math/AABB';
import { Vector3 } from '../../math/Vector3';
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
  private __lastTransformUpdateCountForAutoFit = -1;
  private __lastEntityCountForAutoFit = -1;
  private __lastAutoFitCenter = Vector3.fromCopy3(0, 0, 0);
  private __lastAutoFitRadius = 1;

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
        arrayLength: engine.config.maxLightNumber,
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
        arrayLength: engine.config.maxLightNumber,
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
    // Auto-fit DirectionalLight shadow camera volume before setting up shadow map render passes.
    // This ensures the shadow camera covers the entire scene when rendering the shadow map.
    this.__autoFitDirectionalLightShadowVolume(entities);

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
            isReduceBuffer: false,
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
    // Auto-fit DirectionalLight shadow camera volume to cover the whole scene.
    // Note: This does not move the light; it only adjusts shadowAreaSizeForDirectionalLight and range.
    this.__autoFitDirectionalLightShadowVolume(entities);

    const float32Array = new Float32Array(this.__engine.config.maxLightNumber * 16);

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
          primitive.material.setParameter('depthBiasPV', new VectorN(float32Array));
        }
      }
    }
  }

  private __autoFitDirectionalLightShadowVolume(entities: ISceneGraphEntity[]) {
    const transformUpdateCount = TransformComponent.getUpdateCount(this.__engine);
    if (
      transformUpdateCount === this.__lastTransformUpdateCountForAutoFit &&
      entities.length === this.__lastEntityCountForAutoFit
    ) {
      // Reuse cached center/radius; still apply to lights because light transforms may have changed.
      this.__applyAutoFitToDirectionalLights(this.__lastAutoFitCenter, this.__lastAutoFitRadius);
      return;
    }

    // Filter out non-mesh / invisible entities to avoid environment/background objects inflating bounds.
    // If the application uses a 'background-assets' tag (as RhodoniteEditor2 does), exclude them as well.
    const candidates = entities.filter(entity => {
      const sg = entity.getSceneGraph();
      if (!sg.isVisible) {
        return false;
      }
      const mesh = entity.tryToGetMesh();
      if (mesh == null || mesh.mesh == null) {
        return false;
      }
      if (typeof (entity as any).matchTag === 'function') {
        if ((entity as any).matchTag('type', 'background-assets')) {
          return false;
        }
      }
      return true;
    });

    const targets = candidates.length > 0 ? candidates : entities;

    const merged = new AABB();
    for (const entity of targets) {
      const aabb = entity.getSceneGraph().worldMergedAABBWithSkeletal;
      merged.mergeAABB(aabb);
    }

    if (merged.isVanilla()) {
      return;
    }

    const center = merged.centerPoint;
    const radius = Math.max(merged.lengthCenterToCorner, 1.0);

    this.__lastTransformUpdateCountForAutoFit = transformUpdateCount;
    this.__lastEntityCountForAutoFit = entities.length;
    this.__lastAutoFitCenter = Vector3.fromCopy3(center.x, center.y, center.z);
    this.__lastAutoFitRadius = radius;

    this.__applyAutoFitToDirectionalLights(this.__lastAutoFitCenter, this.__lastAutoFitRadius);
  }

  private __applyAutoFitToDirectionalLights(center: Vector3, radius: number) {
    const areaMargin = 1.15;
    const nearFarMargin = 1.25;

    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    for (const lightComponent of lightComponents) {
      if (!(lightComponent.enable && lightComponent.castShadow)) continue;
      if (lightComponent.type !== LightType.Directional) continue;

      // Use the bounding sphere radius as the shadow area size.
      // This is a conservative estimate that guarantees coverage from any light direction,
      // avoiding expensive per-frame AABB-to-view-space projection calculations.
      const lightEntity = lightComponent.entity as unknown as ISceneGraphEntity;
      const lightPos = lightEntity.getSceneGraph().worldPosition;
      const dist = Vector3.lengthBtw(lightPos, center);

      // Shadow area size: radius covers the scene, plus offset from light position to scene center
      lightComponent.shadowAreaSizeForDirectionalLight = (radius + dist) * areaMargin;

      // zNear: distance from light to nearest point of scene bounding sphere
      // Ensure zNear is positive and has a minimum value
      const desiredZNear = Math.max((dist - radius) / nearFarMargin, 0.01);
      lightComponent.shadowZNearForDirectionalLight = desiredZNear;

      // zFar: distance from light to farthest point of scene bounding sphere
      const desiredZFar = (dist + radius) * nearFarMargin;
      lightComponent.range = desiredZFar;
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
