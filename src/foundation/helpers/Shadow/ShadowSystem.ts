import type { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { LightComponent } from '../../components/Light/LightComponent';
import { RaymarchingComponent } from '../../components/Raymarching/RaymarchingComponent';
import { TransformComponent } from '../../components/Transform';
import { ComponentType } from '../../definitions/ComponentType';
import { LightType, type LightTypeEnum } from '../../definitions/LightType';
import { PixelFormat } from '../../definitions/PixelFormat';
import { TextureFormat } from '../../definitions/TextureFormat';
import { TextureParameter } from '../../definitions/TextureParameter';
import type { Material } from '../../materials/core/Material';
import { AABB } from '../../math/AABB';
import { Matrix44 } from '../../math/Matrix44';
import { VectorN } from '../../math/VectorN';
import { Logger } from '../../misc/Logger';
import { Expression } from '../../renderer/Expression';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { Sampler } from '../../textures/Sampler';
import { attachLightShadowCamera, type ILightEntity, type ISceneGraphEntity } from '../EntityHelper';
import { GaussianBlur } from '../GaussianBlurHelper';
import { RenderableHelper } from '../RenderableHelper';
import { PointShadowMap } from './PointShadowMap';
import { ShadowMap } from './ShadowMap';

/**
 * Provider of the raymarching (SDF) shadow caster passes.
 *
 * The pipeline owns the shadow caster materials (they are built from the merged SDF
 * graph) and supplies a buffer-less full-screen pass for each shadow map variant. The
 * ShadowSystem inserts these passes after the mesh caster passes of the same light, so
 * the moment map ends up with the nearest surface of the two.
 */
/**
 * Parameters of one SDF shadow caster pass request.
 */
export type RaymarchingShadowPassParams = {
  lightComponent: LightComponent;
  lightEntity: ISceneGraphEntity & ILightEntityMethods;
  framebuffer: FrameBuffer;
  kind: 'regular' | 'paraboloidFront' | 'paraboloidBack';
  /** The shadow slot of the light (index into the per-material parameter arrays). */
  shadowSlot: number;
  farPlane?: number;
};

export interface RaymarchingShadowPassProvider {
  /** Whether any raymarching component casts shadows. */
  hasCaster(): boolean;
  /** Creates the SDF caster pass(es) for one shadow map variant. */
  createPasses(params: RaymarchingShadowPassParams): RenderPass[];
  /** Updates the point light far plane of an existing per-slot caster material pair. */
  updatePointLightFarPlane?(shadowSlot: number, farPlane: number): void;
}

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
  private __lightSids: number[] = [];
  private __isShadowSlotShortageWarned = false;
  /** Reused by setDepthBiasPV() on every frame. */
  private __depthBiasPVArray?: Float32Array;
  private __depthBiasPV?: VectorN;
  /** Scratch buffer used to detect whether the bias matrices changed since the last frame. */
  private __depthBiasPVScratch?: Float32Array;
  /** Incremented whenever the content of the depth bias matrices changes. */
  private __depthBiasPVVersion = 0;
  /** `__depthBiasPVVersion` last written to each material, indexed by material UID. */
  private __depthBiasPVVersionOfMaterials: number[] = [];
  private __lastTransformUpdateCountForAutoFit = -1;
  private __lastEntityCountForAutoFit = -1;
  private __lastRaymarchingComponentCountForAutoFit = -1;
  private __lastRaymarchingAABBVersionForAutoFit = -1;
  private __lastAutoFitBounds = new AABB();
  private __needsRefresh = false;
  private __raymarchingShadowPassProvider?: RaymarchingShadowPassProvider;
  private static __tmpLightSpaceBounds = new AABB();
  /** Last shadow state, so a material assigned later (e.g. the raymarching material) can receive it. */
  private __depthTextureIndexList: number[] = [];
  /** Far plane of the paraboloid shadow map of each shadow slot (indexed by slot). */
  private __pointLightFarPlaneList: number[] = [];
  private __directionalShadowMap?: { texture: RenderTargetTexture; sampler: Sampler };
  private __paraboloidShadowMap?: { texture: RenderTargetTexture; sampler: Sampler };

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
        arrayLength: engine.config.maxLightNumberOrOne,
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
        arrayLength: engine.config.maxLightNumberOrOne,
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
  public getExpressions(
    entities: ISceneGraphEntity[],
    additionalMaterials: readonly Material[] = [],
    raymarchingShadowPassProvider?: RaymarchingShadowPassProvider
  ) {
    this.__raymarchingShadowPassProvider = raymarchingShadowPassProvider;
    // With no shadow slots there is nothing to render into the shadow maps, and the materials have no
    // shadow parameters (Config.maxLightNumber = 0 compiles the shadow code out).
    if (this.__engine.config.maxLightNumber <= 0) {
      return [];
    }

    // Auto-fit DirectionalLight shadow camera volume before setting up shadow map render passes.
    // This ensures the shadow camera covers the entire scene when rendering the shadow map.
    this.__autoFitDirectionalLightShadowVolume(entities);
    this.__updateSpotLightShadowZNear(entities);

    // Only these entities are rendered into the shadow maps. Every entity still receives shadows,
    // so `entities` keeps being used for the material setup below.
    const shadowCasters = entities.filter(ShadowSystem.__isShadowCaster);

    const expressions = [];
    // The shadow data of a light is stored at its shadow slot, so the list is indexed by the slot.
    const depthTextureIndexList: number[] = new Array(this.__engine.config.maxLightNumber).fill(-1);
    const pointLightFarPlaneList: number[] = new Array(this.__engine.config.maxLightNumber).fill(1000);

    let depthTextureCount = 0;
    let pointDepthTextureCount = 0;
    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    this.__lightTypes.length = lightComponents.length;
    this.__lightEnables.length = lightComponents.length;
    this.__lightCastShadows.length = lightComponents.length;
    this.__lightSids.length = lightComponents.length;
    this.__assignShadowSlots(
      lightComponents,
      shadowCasters.length > 0 || (raymarchingShadowPassProvider?.hasCaster() ?? false)
    );
    // A spot or directional light renders its shadow map from a camera synchronized to it. Imported lights only
    // get one when they cast shadows (ModelConverter), so attach it here for the lights that started casting
    // shadows later (e.g. enabled in the editor).
    for (const lightComponent of lightComponents) {
      if (lightComponent._shadowSlot >= 0) {
        attachLightShadowCamera(this.__engine, lightComponent.entity as ILightEntity);
      }
    }
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      this.__lightTypes[i] = lightComponent.type;
      this.__lightEnables[i] = lightComponent.enable;
      this.__lightCastShadows[i] = lightComponent.castShadow;
      this.__lightSids[i] = lightComponent.componentSID;

      const shadowSlot = lightComponent._shadowSlot;
      if (shadowSlot < 0) {
        continue;
      }

      if (lightComponent.type === LightType.Point) {
        const farPlane = this.__getPointLightFarPlane(lightComponent, entities);
        const shadowMapExpression = new Expression();
        const pointShadowMapRenderPasses = this.__pointShadowMap.getRenderPasses(
          shadowCasters,
          lightComponent.entity as ISceneGraphEntity & ILightEntityMethods,
          shadowSlot,
          farPlane
        );
        // The SDF caster passes must be inserted between the front and back mesh passes,
        // because the back mesh pass clears the depth buffer again. The SDF pass writes
        // depth-testing moments so the nearest of the mesh and SDF surfaces is kept.
        const frontCasterPasses =
          raymarchingShadowPassProvider?.createPasses({
            lightComponent,
            lightEntity: lightComponent.entity as ISceneGraphEntity & ILightEntityMethods,
            framebuffer: this.__pointShadowMap.getShadowMomentFramebuffer(),
            kind: 'paraboloidFront',
            shadowSlot,
            farPlane,
          }) ?? [];
        const backCasterPasses =
          raymarchingShadowPassProvider?.createPasses({
            lightComponent,
            lightEntity: lightComponent.entity as ISceneGraphEntity & ILightEntityMethods,
            framebuffer: this.__pointShadowMap.getShadowMomentFramebuffer(),
            kind: 'paraboloidBack',
            shadowSlot,
            farPlane,
          }) ?? [];
        shadowMapExpression.addRenderPasses([
          pointShadowMapRenderPasses[0],
          ...frontCasterPasses,
          pointShadowMapRenderPasses[1],
          ...backCasterPasses,
        ]);
        expressions.push(shadowMapExpression);
        const {
          blurExpression: blurExpressionPointLight,
          blurredRenderTarget: blurredRenderTargetPointLight,
          renderPassesBlurred: _renderPassesBlurredPointLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__pointShadowMap.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0)!,
          parameters: {
            blurPassLevel: 3,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4],
            isReduceBuffer: true,
            textureFormat: TextureFormat.RGBA16F,
            outputFrameBuffer: this.__pointShadowMapArrayFramebuffer,
            outputFrameBufferLayerIndex: pointDepthTextureCount,
          },
        });
        this.__setParaboloidBlurredShadowMap(blurredRenderTargetPointLight, entities, additionalMaterials);
        expressions.push(blurExpressionPointLight);
        depthTextureIndexList[shadowSlot] = pointDepthTextureCount;
        pointLightFarPlaneList[shadowSlot] = farPlane;
        pointDepthTextureCount++;
      } else if (lightComponent.type === LightType.Spot || lightComponent.type === LightType.Directional) {
        const shadowMapExpression = new Expression();
        const shadowMapRenderPasses = this.__shadowMap.getRenderPasses(
          shadowCasters,
          lightComponent.entity as ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods
        );
        // The SDF caster pass runs after the mesh caster pass and depth-tests against the
        // mesh depth, so the moment map keeps the nearest of the two surfaces.
        const casterPasses =
          raymarchingShadowPassProvider?.createPasses({
            lightComponent,
            lightEntity: lightComponent.entity as ISceneGraphEntity & ILightEntityMethods,
            framebuffer: this.__shadowMap.getShadowMomentFramebuffer(),
            kind: 'regular',
            shadowSlot,
          }) ?? [];
        shadowMapExpression.addRenderPasses([...shadowMapRenderPasses, ...casterPasses]);
        expressions.push(shadowMapExpression);
        const {
          blurExpression: blurExpressionSpotLight,
          blurredRenderTarget: blurredRenderTargetSpotLight,
          renderPassesBlurred: _renderPassesBlurredSpotLight,
        } = this.__gaussianBlur.createGaussianBlurExpression({
          textureToBlur: this.__shadowMap.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0)!,
          parameters: {
            blurPassLevel: 3,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4, 1.0 / 4],
            isReduceBuffer: true,
            textureFormat: TextureFormat.RG16F,
            outputFrameBuffer: this.__shadowMapArrayFramebuffer,
            outputFrameBufferLayerIndex: depthTextureCount,
          },
        });
        this.__setBlurredShadowMap(blurredRenderTargetSpotLight, entities, additionalMaterials);
        expressions.push(blurExpressionSpotLight);
        depthTextureIndexList[shadowSlot] = depthTextureCount;
        depthTextureCount++;
      }
    }

    this.__depthTextureIndexList = depthTextureIndexList;
    this.__setDepthTextureIndexList(entities, depthTextureIndexList, additionalMaterials);
    this.__pointLightFarPlaneList = pointLightFarPlaneList;
    this.__setPointLightFarPlaneList(entities, pointLightFarPlaneList, additionalMaterials);

    return expressions;
  }

  /**
   * Assigns the shadow slots (the indices of the per-material shadow arrays) to the lights.
   *
   * A shadow casting light keeps the slot equal to its component SID when the SID is below
   * `Config.maxLightNumber` (the convention of manual shadow map setups), and the other shadow casting lights
   * use the free slots. Lights that do not cast shadows get no slot.
   *
   * @param lightComponents - The live light components
   * @param hasShadowCasters - Whether any entity is rendered to the shadow maps
   */
  private __assignShadowSlots(lightComponents: LightComponent[], hasShadowCasters: boolean) {
    const maxLightNumber = this.__engine.config.maxLightNumber;
    const isSlotUsed: boolean[] = new Array(maxLightNumber).fill(false);
    const castsShadow = (lightComponent: LightComponent) =>
      // Without any shadow caster the shadow map would stay empty, so the shadow map and blur
      // passes are not created at all and the light is treated as not casting shadows.
      hasShadowCasters &&
      lightComponent.enable &&
      lightComponent.castShadow &&
      (lightComponent.type === LightType.Point ||
        lightComponent.type === LightType.Spot ||
        lightComponent.type === LightType.Directional);

    for (const lightComponent of lightComponents) {
      const sid = lightComponent.componentSID;
      if (castsShadow(lightComponent) && sid < maxLightNumber) {
        lightComponent._shadowSlot = sid;
        isSlotUsed[sid] = true;
      } else {
        lightComponent._shadowSlot = -1;
      }
    }
    for (const lightComponent of lightComponents) {
      if (!castsShadow(lightComponent) || lightComponent.componentSID < maxLightNumber) {
        continue;
      }
      const freeSlot = isSlotUsed.indexOf(false);
      if (freeSlot < 0) {
        if (!this.__isShadowSlotShortageWarned) {
          Logger.default.warn(
            `ShadowSystem: More than Config.maxLightNumber (${maxLightNumber}) lights cast shadows. The other lights do not cast shadows.`
          );
          this.__isShadowSlotShortageWarned = true;
        }
        continue;
      }
      lightComponent._shadowSlot = freeSlot;
      isSlotUsed[freeSlot] = true;
    }
  }

  /**
   * Sets the blurred shadow map texture for directional and spot lights on all entity materials.
   * Creates a linear sampler and assigns the shadow map texture to the 'depthTexture' parameter.
   * @param blurredRenderTarget - The blurred shadow map render target texture
   * @param entities - Array of scene graph entities to apply the shadow map to
   * @private
   */
  private __setBlurredShadowMap(
    blurredRenderTarget: RenderTargetTexture,
    entities: ISceneGraphEntity[],
    additionalMaterials: readonly Material[] = []
  ) {
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
    for (const material of additionalMaterials) {
      material.setTextureParameter('depthTexture', blurredRenderTarget, sampler);
    }
    this.__directionalShadowMap = { texture: blurredRenderTarget, sampler };
  }

  /**
   * Sets the blurred paraboloid shadow map texture for point lights on all entity materials.
   * Creates a linear sampler and assigns the shadow map texture to the 'paraboloidDepthTexture' parameter.
   * Also sets the UV scale parameter for point light shadow mapping.
   * @param blurredRenderTarget - The blurred paraboloid shadow map render target texture
   * @param entities - Array of scene graph entities to apply the shadow map to
   * @private
   */
  private __setParaboloidBlurredShadowMap(
    blurredRenderTarget: RenderTargetTexture,
    entities: ISceneGraphEntity[],
    additionalMaterials: readonly Material[] = []
  ) {
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
    for (const material of additionalMaterials) {
      material.setTextureParameter('paraboloidDepthTexture', blurredRenderTarget, sampler);
      material.setParameter('pointLightShadowMapUvScale', 0.93);
    }
    this.__paraboloidShadowMap = { texture: blurredRenderTarget, sampler };
  }

  /**
   * Sets the depth texture index list parameter on all entity materials.
   * This parameter maps each light to its corresponding shadow map texture index.
   * @param entities - Array of scene graph entities to apply the index list to
   * @param depthTextureIndexList - Array of indices mapping lights to shadow map textures (-1 for no shadow)
   * @private
   */
  private __setDepthTextureIndexList(
    entities: ISceneGraphEntity[],
    depthTextureIndexList: number[],
    additionalMaterials: readonly Material[] = []
  ) {
    // setParameter() copies the values into each material, so one VectorN can be shared.
    const indexList = new VectorN(new Int32Array(depthTextureIndexList));
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter('depthTextureIndexList', indexList);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setParameter('depthTextureIndexList', indexList);
    }
  }

  /**
   * Returns the far plane used to normalize the paraboloid shadow map of a point light.
   *
   * The priority is the explicit `pointLightShadowFarPlane`, the effective range of the
   * light, its automatic range, and finally the farthest shadow receiver in the scene.
   * A finite far plane keeps the cleared background depth close to the casters; with the
   * legacy unlimited far plane of 1000 the Gaussian blur mixes the far background into the
   * moments and the shadows of scenes much smaller than 1000 units disappear.
   *
   * @param lightComponent - The point light component
   * @param entities - The entities in the scene (used for the automatic far plane)
   */
  private __getPointLightFarPlane(lightComponent: LightComponent, entities: ISceneGraphEntity[]) {
    const explicitFarPlane = lightComponent.pointLightShadowFarPlane;
    if (explicitFarPlane > 0) {
      return explicitFarPlane;
    }
    if (lightComponent.range > 0) {
      return lightComponent.range;
    }
    // The effective range includes the automatic range (Config.lightAutoRangeThreshold) and
    // Config.lightRangeScale. That range is a light-culling/shading bound, not a scene bound: with
    // the editor's threshold of 0.01 an intensity-20 light gets a range of 44.7 even in a scene
    // only a few units large. Fit the far plane to the receivers instead and use the effective
    // range only as an upper bound (receivers beyond it are unlit anyway).
    const sceneFarPlane = this.__getSceneFarPlaneForPointLight(lightComponent, entities);
    const effectiveRange = lightComponent._lightPropertyForGpu._v[1];
    if (effectiveRange > 0) {
      return Math.min(sceneFarPlane, effectiveRange);
    }
    return sceneFarPlane;
  }

  /**
   * Returns a far plane that covers every shadow receiver of an unlimited point light.
   *
   * The farthest corner of the merged AABBs is used so that receivers at the far side of
   * an object are still inside the shadow map. Background assets and light gizmos are
   * ignored. When the scene has no receiver, the legacy value is kept.
   *
   * @param lightComponent - The point light component
   * @param entities - The entities in the scene
   * @private
   */
  private __getSceneFarPlaneForPointLight(lightComponent: LightComponent, entities: ISceneGraphEntity[]): number {
    const lightPositionArray = lightComponent._lightPositionForGpu._v;
    const lightPosition = {
      x: lightPositionArray[0],
      y: lightPositionArray[1],
      z: lightPositionArray[2],
    };
    let farthestDistanceSquared = 0;
    const receivers = entities.filter(
      entity => ShadowSystem.__isShadowCaster(entity) && !ShadowSystem.__isLightEntity(entity)
    );
    for (const entity of receivers) {
      const sceneGraph = entity.getSceneGraph();
      if (!sceneGraph.isVisible) {
        continue;
      }
      const aabb = sceneGraph.worldMergedAABB;
      if (aabb != null && !aabb.isVanilla()) {
        const min = aabb.minPoint;
        const max = aabb.maxPoint;
        const dx = Math.max(Math.abs(lightPosition.x - min.x), Math.abs(lightPosition.x - max.x));
        const dy = Math.max(Math.abs(lightPosition.y - min.y), Math.abs(lightPosition.y - max.y));
        const dz = Math.max(Math.abs(lightPosition.z - min.z), Math.abs(lightPosition.z - max.z));
        farthestDistanceSquared = Math.max(farthestDistanceSquared, dx * dx + dy * dy + dz * dz);
      } else {
        const position = sceneGraph.worldPosition;
        const dx = position.x - lightPosition.x;
        const dy = position.y - lightPosition.y;
        const dz = position.z - lightPosition.z;
        farthestDistanceSquared = Math.max(farthestDistanceSquared, dx * dx + dy * dy + dz * dz);
      }
    }

    // Raymarching receivers are not in the render expressions' entity list.
    const raymarchingComponents = this.__engine.componentRepository.getComponentsWithType(
      RaymarchingComponent
    ) as RaymarchingComponent[];
    for (const raymarchingComponent of raymarchingComponents) {
      const raymarchingSceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
      if (raymarchingSceneGraph == null || !raymarchingSceneGraph.isVisible) {
        continue;
      }
      const aabb = raymarchingComponent.calcWorldAABB();
      if (aabb == null || aabb.isVanilla()) {
        continue;
      }
      const min = aabb.minPoint;
      const max = aabb.maxPoint;
      const dx = Math.max(Math.abs(lightPosition.x - min.x), Math.abs(lightPosition.x - max.x));
      const dy = Math.max(Math.abs(lightPosition.y - min.y), Math.abs(lightPosition.y - max.y));
      const dz = Math.max(Math.abs(lightPosition.z - min.z), Math.abs(lightPosition.z - max.z));
      farthestDistanceSquared = Math.max(farthestDistanceSquared, dx * dx + dy * dy + dz * dz);
    }

    if (farthestDistanceSquared <= 0) {
      return 1000;
    }
    // A small margin keeps the farthest receiver inside the shadow map.
    return Math.sqrt(farthestDistanceSquared) * 1.05 + 0.1;
  }

  /**
   * Updates the per-slot far planes of the point light shadow maps when they change.
   * Calling this every frame keeps the automatic far plane in sync with moving lights,
   * casters and receivers without rebuilding the shadow expressions.
   *
   * @param entities - The entities in the scene
   * @param additionalMaterials - Materials that are not reached through the entities
   *   (for example the raymarching material)
   */
  public updatePointLightFarPlanes(entities: ISceneGraphEntity[], additionalMaterials: readonly Material[] = []) {
    if (this.__engine.config.maxLightNumber <= 0) {
      return;
    }
    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    const pointLights = lightComponents.filter(
      lightComponent =>
        lightComponent.type === LightType.Point &&
        lightComponent.enable &&
        lightComponent.castShadow &&
        lightComponent._shadowSlot >= 0
    );
    if (pointLights.length === 0) {
      return;
    }

    const maxLightNumber = this.__engine.config.maxLightNumber;
    const newList: number[] = new Array(maxLightNumber).fill(1000);
    for (const lightComponent of pointLights) {
      newList[lightComponent._shadowSlot] = this.__getPointLightFarPlane(lightComponent, entities);
    }

    let changed = this.__pointLightFarPlaneList.length !== maxLightNumber;
    if (!changed) {
      for (let i = 0; i < maxLightNumber; i++) {
        if (Math.abs(newList[i] - this.__pointLightFarPlaneList[i]) > 1e-4) {
          changed = true;
          break;
        }
      }
    }
    if (!changed) {
      return;
    }

    for (const lightComponent of pointLights) {
      const shadowSlot = lightComponent._shadowSlot;
      this.__pointShadowMap.setFarPlane(shadowSlot, newList[shadowSlot]);
      // The SDF caster materials hold the far plane per slot as a material parameter.
      this.__raymarchingShadowPassProvider?.updatePointLightFarPlane?.(shadowSlot, newList[shadowSlot]);
    }
    this.__pointLightFarPlaneList = newList;
    this.__setPointLightFarPlaneList(entities, newList, additionalMaterials);
  }

  /**
   * Sets the per-shadow-slot far planes of the paraboloid shadow maps on all entity materials.
   * @param entities - Array of scene graph entities to apply the far planes to
   * @param pointLightFarPlaneList - Far plane of each shadow slot (1000 for slots without a point light)
   * @private
   */
  private __setPointLightFarPlaneList(
    entities: ISceneGraphEntity[],
    pointLightFarPlaneList: number[],
    additionalMaterials: readonly Material[] = []
  ) {
    // setParameter() copies the values into each material, so one VectorN can be shared.
    const farPlaneList = new VectorN(new Float32Array(pointLightFarPlaneList));
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter('pointLightFarPlane', farPlaneList);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setParameter('pointLightFarPlane', farPlaneList);
    }
  }

  /**
   * Fits the zNear of the spot light shadow cameras to the scene.
   *
   * A perspective shadow map spends most of its depth range near the far plane, which makes
   * variance shadow maps shallow. Setting zNear below the nearest caster makes the depth
   * distribution more linear. The value is limited to 5% of the light range and to 1.0 so
   * that it stays conservative.
   *
   * @param entities - The entities in the scene
   * @private
   */
  private __updateSpotLightShadowZNear(entities: ISceneGraphEntity[]) {
    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    const spotLights = lightComponents.filter(
      lightComponent => lightComponent.type === LightType.Spot && lightComponent.enable && lightComponent.castShadow
    );
    if (spotLights.length === 0) {
      return;
    }

    const shadowCasters = entities.filter(
      entity => ShadowSystem.__isShadowCaster(entity) && !ShadowSystem.__isLightEntity(entity)
    );

    for (const lightComponent of spotLights) {
      const lightPositionArray = lightComponent._lightPositionForGpu._v;
      const lightPosition = {
        x: lightPositionArray[0],
        y: lightPositionArray[1],
        z: lightPositionArray[2],
      };
      let nearestDistanceSquared = Number.MAX_VALUE;
      for (const entity of shadowCasters) {
        const sceneGraph = entity.getSceneGraph();
        const aabb = sceneGraph.worldMergedAABB;
        let distanceSquared: number;
        if (aabb != null && !aabb.isVanilla()) {
          const min = aabb.minPoint;
          const max = aabb.maxPoint;
          // A caster that encloses the light (for example a background sphere) does not bound
          // zNear: its surface can be far from the light even when its AABB contains it.
          if (
            min.x <= lightPosition.x &&
            lightPosition.x <= max.x &&
            min.y <= lightPosition.y &&
            lightPosition.y <= max.y &&
            min.z <= lightPosition.z &&
            lightPosition.z <= max.z
          ) {
            continue;
          }
          const dx =
            lightPosition.x < min.x ? min.x - lightPosition.x : lightPosition.x > max.x ? lightPosition.x - max.x : 0;
          const dy =
            lightPosition.y < min.y ? min.y - lightPosition.y : lightPosition.y > max.y ? lightPosition.y - max.y : 0;
          const dz =
            lightPosition.z < min.z ? min.z - lightPosition.z : lightPosition.z > max.z ? lightPosition.z - max.z : 0;
          distanceSquared = dx * dx + dy * dy + dz * dz;
        } else {
          // Procedural meshes can have a vanilla merged AABB. Their world position is still
          // a useful conservative bound: zNear stays at half the distance to the center.
          const position = sceneGraph.worldPosition;
          const dx = position.x - lightPosition.x;
          const dy = position.y - lightPosition.y;
          const dz = position.z - lightPosition.z;
          distanceSquared = dx * dx + dy * dy + dz * dz;
        }
        if (distanceSquared < nearestDistanceSquared) {
          nearestDistanceSquared = distanceSquared;
        }
      }

      // SDF entities are not part of the mesh caster entities, so their bounds are added
      // for the same nearest-distance estimate. Receivers are included as well because
      // they need to lie beyond the shadow camera's near plane.
      const raymarchingComponents = this.__engine.componentRepository.getComponentsWithType(
        RaymarchingComponent
      ) as RaymarchingComponent[];
      for (const raymarchingComponent of raymarchingComponents) {
        const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
        if (sceneGraph == null || !sceneGraph.isVisible) {
          continue;
        }
        if (raymarchingComponent.entity.getTagValue('type') === 'background-assets') {
          continue;
        }
        const aabb = sceneGraph.worldMergedAABB;
        // Unbounded SDFs (SdBar / SdTube / SdRepeat) have a vanilla AABB; they keep the
        // conservative default zNear instead of a potentially wrong bound.
        if (aabb.isVanilla()) {
          continue;
        }
        const min = aabb.minPoint;
        const max = aabb.maxPoint;
        if (
          min.x <= lightPosition.x &&
          lightPosition.x <= max.x &&
          min.y <= lightPosition.y &&
          lightPosition.y <= max.y &&
          min.z <= lightPosition.z &&
          lightPosition.z <= max.z
        ) {
          continue;
        }
        const dx =
          lightPosition.x < min.x ? min.x - lightPosition.x : lightPosition.x > max.x ? lightPosition.x - max.x : 0;
        const dy =
          lightPosition.y < min.y ? min.y - lightPosition.y : lightPosition.y > max.y ? lightPosition.y - max.y : 0;
        const dz =
          lightPosition.z < min.z ? min.z - lightPosition.z : lightPosition.z > max.z ? lightPosition.z - max.z : 0;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        if (distanceSquared < nearestDistanceSquared) {
          nearestDistanceSquared = distanceSquared;
        }
      }

      let zNear = 0.1;
      if (lightComponent.range > 0 && Number.isFinite(nearestDistanceSquared)) {
        const rangeCap = Math.min(lightComponent.range * 0.05, 1.0);
        zNear = Math.max(0.01, Math.min(Math.sqrt(nearestDistanceSquared) * 0.5, rangeCap));
      }
      lightComponent._setShadowZNearForSpotLightAuto(zNear);
    }
  }

  private static __isLightEntity(entity: ISceneGraphEntity) {
    try {
      const getLight = (entity as unknown as { getLight?: () => unknown }).getLight;
      return typeof getLight === 'function' && getLight.call(entity) != null;
    } catch {
      return false;
    }
  }

  /**
   * Sets the depth bias projection-view matrices for shadow mapping on all PBR materials.
   * Calculates and applies bias matrices for directional and spot lights to reduce shadow acne.
   * @param entities - Array of scene graph entities to apply the bias matrices to
   */
  public setDepthBiasPV(entities: ISceneGraphEntity[], additionalMaterials: readonly Material[] = []) {
    // The materials have no depthBiasPV parameter when there are no shadow slots.
    if (this.__engine.config.maxLightNumber <= 0) {
      return;
    }

    // Auto-fit DirectionalLight shadow camera volume to cover the whole scene.
    // Note: This does not move the light; it only adjusts shadowAreaSizeForDirectionalLight and range.
    this.__autoFitDirectionalLightShadowVolume(entities);
    this.__updateSpotLightShadowZNear(entities);
    this.updatePointLightFarPlanes(entities, additionalMaterials);

    // This runs every frame, so the arrays and the VectorN are reused. setParameter() copies the
    // values into the material's own variable, so sharing one VectorN between materials is safe.
    // The matrices are computed into a scratch buffer first so that a change can be detected.
    const arrayLength = this.__engine.config.maxLightNumber * 16;
    let float32Array = this.__depthBiasPVArray;
    let depthBiasPV = this.__depthBiasPV;
    let scratch = this.__depthBiasPVScratch;
    if (float32Array == null || depthBiasPV == null || scratch == null || float32Array.length !== arrayLength) {
      float32Array = new Float32Array(arrayLength);
      depthBiasPV = new VectorN(float32Array);
      scratch = new Float32Array(arrayLength);
      this.__depthBiasPVArray = float32Array;
      this.__depthBiasPV = depthBiasPV;
      this.__depthBiasPVScratch = scratch;
      this.__depthBiasPVVersion++;
    } else {
      scratch.fill(0);
    }

    // Iterate the internal component array instead of getComponentsWithType(), which allocates a
    // filtered copy. The matrix of a light is stored at its shadow slot.
    const lightComponents = this.__engine.componentRepository._getComponents(LightComponent) as
      | (LightComponent | undefined)[]
      | undefined;
    if (lightComponents != null) {
      const maxLightNumber = this.__engine.config.maxLightNumber;
      for (let i = 0; i < lightComponents.length; i++) {
        const lightComponent = lightComponents[i];
        if (lightComponent == null) {
          continue;
        }
        const shadowSlot = lightComponent._shadowSlot;
        if (shadowSlot < 0 || shadowSlot >= maxLightNumber) {
          continue;
        }
        if (lightComponent.type === LightType.Directional || lightComponent.type === LightType.Spot) {
          const lightEntity = lightComponent.entity as ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods;
          const cameraComponent = lightEntity.tryToGetCamera();
          if (cameraComponent != null) {
            const biasViewProjectionMatrix = cameraComponent.biasViewProjectionMatrix;
            scratch.set(biasViewProjectionMatrix._v, shadowSlot * 16);
          }
        }
      }
    }

    for (let i = 0; i < arrayLength; i++) {
      if (scratch[i] !== float32Array[i]) {
        float32Array.set(scratch);
        this.__depthBiasPVVersion++;
        break;
      }
    }

    // Writing the parameter costs a comparison of maxLightNumber * 16 floats per material, which
    // dominates the frame in scenes with thousands of materials. Each material is written only
    // when the matrices changed or when the material has not received the current values yet
    // (e.g. a newly created or newly assigned material).
    const version = this.__depthBiasPVVersion;
    const versionOfMaterials = this.__depthBiasPVVersionOfMaterials;
    for (let i = 0; i < entities.length; i++) {
      const meshComponent = entities[i].tryToGetMesh();
      const mesh = meshComponent?.mesh;
      if (mesh != null) {
        const primitiveNumber = mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveNumber; j++) {
          const material: Material = mesh.getPrimitiveAt(j).material;
          const materialUid = material.materialUID;
          if (versionOfMaterials[materialUid] === version) {
            continue;
          }
          material.setParameter('depthBiasPV', depthBiasPV);
          // Materials without the parameter are left unmarked: material fields are fixed at
          // creation, so this only re-checks a cheap map lookup for them.
          if (material._allFieldsInfo.has('depthBiasPV')) {
            versionOfMaterials[materialUid] = version;
          }
        }
      }
    }
    for (const material of additionalMaterials) {
      const materialUid = material.materialUID;
      if (versionOfMaterials[materialUid] === version) {
        continue;
      }
      material.setParameter('depthBiasPV', depthBiasPV);
      if (material._allFieldsInfo.has('depthBiasPV')) {
        versionOfMaterials[materialUid] = version;
      }
    }
  }

  /**
   * Applies the last computed shadow state (shadow maps, index list and bias matrices)
   * to materials that are assigned after getExpressions() ran, for example the
   * raymarching material of the buffer-less full-screen pass.
   */
  public applyShadowParametersToMaterials(materials: readonly Material[]) {
    if (this.__engine.config.maxLightNumber <= 0) {
      return;
    }
    const indexList = new VectorN(
      new Int32Array(
        this.__depthTextureIndexList.length > 0
          ? this.__depthTextureIndexList
          : new Array(this.__engine.config.maxLightNumber).fill(-1)
      )
    );
    const farPlaneList = new VectorN(
      new Float32Array(
        this.__pointLightFarPlaneList.length > 0
          ? this.__pointLightFarPlaneList
          : new Array(this.__engine.config.maxLightNumber).fill(1000)
      )
    );
    for (const material of materials) {
      material.setParameter('depthTextureIndexList', indexList);
      material.setParameter('pointLightFarPlane', farPlaneList);
      if (this.__directionalShadowMap != null) {
        material.setTextureParameter(
          'depthTexture',
          this.__directionalShadowMap.texture,
          this.__directionalShadowMap.sampler
        );
      }
      if (this.__paraboloidShadowMap != null) {
        material.setTextureParameter(
          'paraboloidDepthTexture',
          this.__paraboloidShadowMap.texture,
          this.__paraboloidShadowMap.sampler
        );
        material.setParameter('pointLightShadowMapUvScale', 0.93);
      }
    }
  }

  /**
   * Background assets (tagged `type: background-assets`, e.g. the environment cube and the grid
   * in RhodoniteEditor2) do not cast shadows. The shadow volume auto-fit excludes them as well.
   */
  private static __isShadowCaster(entity: ISceneGraphEntity) {
    return entity.getTagValue('type') !== 'background-assets';
  }

  private __autoFitDirectionalLightShadowVolume(entities: ISceneGraphEntity[]) {
    const transformUpdateCount = TransformComponent.getUpdateCount(this.__engine);
    const raymarchingComponentCount = this.__getRaymarchingComponentCount();
    const raymarchingAABBVersion = RaymarchingComponent.getAABBVersion(this.__engine);
    if (
      transformUpdateCount === this.__lastTransformUpdateCountForAutoFit &&
      entities.length === this.__lastEntityCountForAutoFit &&
      raymarchingComponentCount === this.__lastRaymarchingComponentCountForAutoFit &&
      raymarchingAABBVersion === this.__lastRaymarchingAABBVersionForAutoFit
    ) {
      // Reuse the cached bounds; the per-light fit still follows light transforms.
      this.__applyAutoFitToDirectionalLights(this.__lastAutoFitBounds);
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

    // SDF entities are not mesh entities, so their bounds are added separately (the
    // scene graph AABB already contains the SDF bounds). Receivers are included as well:
    // they need to lie inside the light frustum for the shadow map lookup.
    this.__mergeRaymarchingShadowBounds(merged);

    if (merged.isVanilla()) {
      return;
    }

    this.__lastTransformUpdateCountForAutoFit = transformUpdateCount;
    this.__lastEntityCountForAutoFit = entities.length;
    this.__lastRaymarchingComponentCountForAutoFit = raymarchingComponentCount;
    this.__lastRaymarchingAABBVersionForAutoFit = raymarchingAABBVersion;
    this.__lastAutoFitBounds.copyComponents(merged);

    this.__applyAutoFitToDirectionalLights(this.__lastAutoFitBounds);
  }

  /**
   * Resets the directional/spot shadow volume fitting cache, so the next frame recomputes
   * the volume (including the SDF bounds).
   */
  public invalidateShadowVolumeFitting() {
    this.__lastTransformUpdateCountForAutoFit = -1;
    this.__lastRaymarchingAABBVersionForAutoFit = -1;
  }

  private __getRaymarchingComponentCount() {
    const components = this.__engine.componentRepository.getComponentsWithType(
      RaymarchingComponent
    ) as RaymarchingComponent[];
    return components.length;
  }

  /**
   * Merges the world AABBs of the visible raymarching components into `merged`.
   * The scene graph AABB of an SDF entity already contains the SDF bounds, so the cached
   * merged AABB is used instead of evaluating the graph again.
   */
  private __mergeRaymarchingShadowBounds(merged: AABB) {
    const components = this.__engine.componentRepository.getComponentsWithType(
      RaymarchingComponent
    ) as RaymarchingComponent[];
    for (const component of components) {
      const sceneGraph = component.entity.tryToGetSceneGraph();
      if (sceneGraph == null || !sceneGraph.isVisible) {
        continue;
      }
      if (component.entity.getTagValue('type') === 'background-assets') {
        continue;
      }
      const aabb = sceneGraph.worldMergedAABBWithSkeletal;
      if (!aabb.isVanilla()) {
        merged.mergeAABB(aabb);
      }
    }
  }

  /**
   * Fits every directional light's orthographic shadow camera to `bounds`.
   *
   * The bounds are projected into the light's local space, and the ortho extents and the
   * depth range are taken from that AABB (not from the light-to-center distance). This
   * keeps the shadow map's world-per-texel small enough for the VSM blur not to wash out
   * the cast shadows, while still covering every caster and receiver.
   */
  private __applyAutoFitToDirectionalLights(bounds: AABB) {
    const areaMargin = 1.15;
    const nearFarMargin = 1.25;

    // Called every frame: iterate the internal array instead of allocating a filtered copy.
    const lightComponents = this.__engine.componentRepository._getComponents(LightComponent) as
      | (LightComponent | undefined)[]
      | undefined;
    if (lightComponents == null) {
      return;
    }
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      if (lightComponent == null) continue;
      if (!(lightComponent.enable && lightComponent.castShadow)) continue;
      if (lightComponent.type !== LightType.Directional) continue;

      const lightEntity = lightComponent.entity as unknown as ISceneGraphEntity;
      const lightWorldMatrix = lightEntity.getSceneGraph().matrixInner;
      const inverseLightMatrix = Matrix44.invert(lightWorldMatrix);
      AABB.multiplyMatrixTo(inverseLightMatrix, bounds, ShadowSystem.__tmpLightSpaceBounds);
      const lightSpaceBounds = ShadowSystem.__tmpLightSpaceBounds;
      const min = lightSpaceBounds.minPoint;
      const max = lightSpaceBounds.maxPoint;

      // The light camera looks along its local -Z, so the distance from the camera is -z.
      const depthNear = Math.max(-max.z, 0);
      const depthFar = Math.max(-min.z, depthNear + 1e-3);
      const zNear = Math.max(depthNear / nearFarMargin, 0.01);
      const zFar = Math.max(depthFar * nearFarMargin, zNear + 0.01);

      // The orthographic projection is square and symmetric around the light's view axis.
      const halfExtent = Math.max(Math.abs(min.x), Math.abs(max.x), Math.abs(min.y), Math.abs(max.y), 1.0);
      const areaSize = halfExtent * areaMargin;

      lightComponent.shadowAreaSizeForDirectionalLight = areaSize;
      lightComponent.shadowZNearForDirectionalLight = zNear;
      // The camera sync uses range for zFar.
      lightComponent.range = zFar;
    }
  }

  /**
   * Checks if the light configuration has changed since the last update.
   * Compares the current light types, enable states, and shadow casting states with cached values.
   * Also returns true if a manual refresh was requested via setNeedsRefresh().
   * @returns True if any light has changed its type, enable state, or shadow casting state; false otherwise
   */
  public isLightChanged() {
    if (this.__needsRefresh) {
      this.__needsRefresh = false;
      return true;
    }

    const lightComponents = this.__engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

    if (this.__lightTypes.length !== lightComponents.length) {
      return true;
    }

    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      if (
        this.__lightTypes[i] !== lightComponent.type ||
        this.__lightEnables[i] !== lightComponent.enable ||
        this.__lightCastShadows[i] !== lightComponent.castShadow ||
        this.__lightSids[i] !== lightComponent.componentSID
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Requests a refresh of shadow expressions on the next frame.
   * This is useful when materials with shadow support have been changed or added.
   */
  public setNeedsRefresh() {
    this.__needsRefresh = true;
  }
}
