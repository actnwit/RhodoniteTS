// src/foundation/helpers/Shadow/ShadowSystem.ts
import { LightComponent } from "../../components/Light/LightComponent.js";
import { RaymarchingComponent } from "../../components/Raymarching/RaymarchingComponent.js";
import { TransformComponent } from "../../components/Transform/index.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { LightType } from "../../definitions/LightType.js";
import { PixelFormat } from "../../definitions/PixelFormat.js";
import { TextureFormat } from "../../definitions/TextureFormat.js";
import { TextureParameter } from "../../definitions/TextureParameter.js";
import { AABB } from "../../math/AABB.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { VectorN } from "../../math/VectorN.js";
import { Logger } from "../../misc/Logger.js";
import { Expression } from "../../renderer/Expression.js";
import { Sampler } from "../../textures/Sampler.js";
import { attachLightShadowCamera } from "../EntityHelper.js";
import { GaussianBlur } from "../GaussianBlurHelper.js";
import { RenderableHelper } from "../RenderableHelper.js";
import { PointShadowMap } from "./PointShadowMap.js";
import { ShadowMap } from "./ShadowMap.js";
var _ShadowSystem = class _ShadowSystem {
  /**
   * Creates a new ShadowSystem instance with the specified shadow map resolution.
   * Initializes shadow map and point shadow map systems, along with framebuffers for texture arrays.
   * @param shadowMapSize - The resolution (width and height) of shadow maps in pixels
   */
  constructor(engine, shadowMapSize) {
    this.xo = [];
    this.Bo = [];
    this.Co = [];
    this.Do = [];
    this.No = false;
    /** Incremented whenever the content of the depth bias matrices changes. */
    this.Eo = 0;
    /** `__depthBiasPVVersion` last written to each material, indexed by material UID. */
    this.$o = [];
    this.Fo = -1;
    this.Ro = -1;
    this.So = -1;
    this.Go = -1;
    this.Ho = new AABB();
    this.Io = false;
    /** Last shadow state, so a material assigned later (e.g. the raymarching material) can receive it. */
    this.Jo = [];
    /** Far plane of the paraboloid shadow map of each shadow slot (indexed by slot). */
    this.vo = [];
    this.c = engine;
    this.wo = new ShadowMap(engine);
    this.uo = new PointShadowMap(engine);
    this.Ao = new GaussianBlur(engine);
    const [shadowMapArrayFramebuffer, _shadowMapArrayRenderTargetTexture] = RenderableHelper.createFrameBufferTextureArray(engine, {
      width: shadowMapSize,
      height: shadowMapSize,
      arrayLength: engine.config.maxLightNumberOrOne,
      level: 0,
      internalFormat: TextureFormat.RG16F,
      format: PixelFormat.RG,
      type: ComponentType.Float
    });
    this.Lo = shadowMapArrayFramebuffer;
    const [pointShadowMapArrayFramebuffer, _pointShadowMapArrayRenderTargetTexture] = RenderableHelper.createFrameBufferTextureArray(engine, {
      width: shadowMapSize,
      height: shadowMapSize,
      arrayLength: engine.config.maxLightNumberOrOne,
      level: 0,
      internalFormat: TextureFormat.RGBA16F,
      format: PixelFormat.RGBA,
      type: ComponentType.Float
    });
    this.Mo = pointShadowMapArrayFramebuffer;
  }
  /**
   * Generates rendering expressions for shadow mapping based on the provided entities and active lights.
   * Creates shadow map render passes for each shadow-casting light and applies Gaussian blur post-processing.
   * @param entities - Array of scene graph entities to be rendered for shadow mapping
   * @returns Array of Expression objects containing the shadow mapping render passes
   */
  getExpressions(entities, additionalMaterials = [], raymarchingShadowPassProvider) {
    var _a, _b, _c, _d;
    this.To = raymarchingShadowPassProvider;
    if (this.c.config.maxLightNumber <= 0) {
      return [];
    }
    this.Vo(entities);
    this.Wo(entities);
    const shadowCasters = entities.filter(_ShadowSystem.Ko);
    const expressions = [];
    const depthTextureIndexList = new Array(this.c.config.maxLightNumber).fill(-1);
    const pointLightFarPlaneList = new Array(this.c.config.maxLightNumber).fill(1e3);
    let depthTextureCount = 0;
    let pointDepthTextureCount = 0;
    const lightComponents = this.c.componentRepository.getComponentsWithType(LightComponent);
    this.xo.length = lightComponents.length;
    this.Bo.length = lightComponents.length;
    this.Co.length = lightComponents.length;
    this.Do.length = lightComponents.length;
    this.ap(
      lightComponents,
      shadowCasters.length > 0 || ((_a = raymarchingShadowPassProvider == null ? void 0 : raymarchingShadowPassProvider.hasCaster()) != null ? _a : false)
    );
    for (const lightComponent of lightComponents) {
      if (lightComponent._shadowSlot >= 0) {
        attachLightShadowCamera(this.c, lightComponent.entity);
      }
    }
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      this.xo[i] = lightComponent.type;
      this.Bo[i] = lightComponent.enable;
      this.Co[i] = lightComponent.castShadow;
      this.Do[i] = lightComponent.componentSID;
      const shadowSlot = lightComponent._shadowSlot;
      if (shadowSlot < 0) {
        continue;
      }
      if (lightComponent.type === LightType.Point) {
        const farPlane = this.Xo(lightComponent, entities);
        const shadowMapExpression = new Expression();
        const pointShadowMapRenderPasses = this.uo.getRenderPasses(
          shadowCasters,
          lightComponent.entity,
          shadowSlot,
          farPlane
        );
        const frontCasterPasses = (_b = raymarchingShadowPassProvider == null ? void 0 : raymarchingShadowPassProvider.createPasses({
          lightComponent,
          lightEntity: lightComponent.entity,
          framebuffer: this.uo.getShadowMomentFramebuffer(),
          kind: "paraboloidFront",
          shadowSlot,
          farPlane
        })) != null ? _b : [];
        const backCasterPasses = (_c = raymarchingShadowPassProvider == null ? void 0 : raymarchingShadowPassProvider.createPasses({
          lightComponent,
          lightEntity: lightComponent.entity,
          framebuffer: this.uo.getShadowMomentFramebuffer(),
          kind: "paraboloidBack",
          shadowSlot,
          farPlane
        })) != null ? _c : [];
        shadowMapExpression.addRenderPasses([
          pointShadowMapRenderPasses[0],
          ...frontCasterPasses,
          pointShadowMapRenderPasses[1],
          ...backCasterPasses
        ]);
        expressions.push(shadowMapExpression);
        const {
          blurExpression: blurExpressionPointLight,
          blurredRenderTarget: blurredRenderTargetPointLight,
          renderPassesBlurred: _renderPassesBlurredPointLight
        } = this.Ao.createGaussianBlurExpression({
          textureToBlur: this.uo.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0),
          parameters: {
            blurPassLevel: 3,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4],
            isReduceBuffer: true,
            textureFormat: TextureFormat.RGBA16F,
            outputFrameBuffer: this.Mo,
            outputFrameBufferLayerIndex: pointDepthTextureCount
          }
        });
        this.bp(blurredRenderTargetPointLight, entities, additionalMaterials);
        expressions.push(blurExpressionPointLight);
        depthTextureIndexList[shadowSlot] = pointDepthTextureCount;
        pointLightFarPlaneList[shadowSlot] = farPlane;
        pointDepthTextureCount++;
      } else if (lightComponent.type === LightType.Spot || lightComponent.type === LightType.Directional) {
        const shadowMapExpression = new Expression();
        const shadowMapRenderPasses = this.wo.getRenderPasses(
          shadowCasters,
          lightComponent.entity
        );
        const casterPasses = (_d = raymarchingShadowPassProvider == null ? void 0 : raymarchingShadowPassProvider.createPasses({
          lightComponent,
          lightEntity: lightComponent.entity,
          framebuffer: this.wo.getShadowMomentFramebuffer(),
          kind: "regular",
          shadowSlot
        })) != null ? _d : [];
        shadowMapExpression.addRenderPasses([...shadowMapRenderPasses, ...casterPasses]);
        expressions.push(shadowMapExpression);
        const {
          blurExpression: blurExpressionSpotLight,
          blurredRenderTarget: blurredRenderTargetSpotLight,
          renderPassesBlurred: _renderPassesBlurredSpotLight
        } = this.Ao.createGaussianBlurExpression({
          textureToBlur: this.wo.getShadowMomentFramebuffer().getColorAttachedRenderTargetTexture(0),
          parameters: {
            blurPassLevel: 3,
            gaussianKernelSize: 5,
            gaussianVariance: 5,
            synthesizeCoefficient: [1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4, 1 / 4],
            isReduceBuffer: true,
            textureFormat: TextureFormat.RG16F,
            outputFrameBuffer: this.Lo,
            outputFrameBufferLayerIndex: depthTextureCount
          }
        });
        this.cp(blurredRenderTargetSpotLight, entities, additionalMaterials);
        expressions.push(blurExpressionSpotLight);
        depthTextureIndexList[shadowSlot] = depthTextureCount;
        depthTextureCount++;
      }
    }
    this.Jo = depthTextureIndexList;
    this.dp(entities, depthTextureIndexList, additionalMaterials);
    this.vo = pointLightFarPlaneList;
    this.Yo(entities, pointLightFarPlaneList, additionalMaterials);
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
  ap(lightComponents, hasShadowCasters) {
    const maxLightNumber = this.c.config.maxLightNumber;
    const isSlotUsed = new Array(maxLightNumber).fill(false);
    const castsShadow = (lightComponent) => (
      // Without any shadow caster the shadow map would stay empty, so the shadow map and blur
      // passes are not created at all and the light is treated as not casting shadows.
      hasShadowCasters && lightComponent.enable && lightComponent.castShadow && (lightComponent.type === LightType.Point || lightComponent.type === LightType.Spot || lightComponent.type === LightType.Directional)
    );
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
        if (!this.No) {
          Logger.default.warn(
            `ShadowSystem: More than Config.maxLightNumber (${maxLightNumber}) lights cast shadows. The other lights do not cast shadows.`
          );
          this.No = true;
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
  cp(blurredRenderTarget, entities, additionalMaterials = []) {
    const sampler = new Sampler(this.c, {
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge
    });
    sampler.create();
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setTextureParameter("depthTexture", blurredRenderTarget, sampler);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setTextureParameter("depthTexture", blurredRenderTarget, sampler);
    }
    this.yo = { texture: blurredRenderTarget, sampler };
  }
  /**
   * Sets the blurred paraboloid shadow map texture for point lights on all entity materials.
   * Creates a linear sampler and assigns the shadow map texture to the 'paraboloidDepthTexture' parameter.
   * Also sets the UV scale parameter for point light shadow mapping.
   * @param blurredRenderTarget - The blurred paraboloid shadow map render target texture
   * @param entities - Array of scene graph entities to apply the shadow map to
   * @private
   */
  bp(blurredRenderTarget, entities, additionalMaterials = []) {
    const sampler = new Sampler(this.c, {
      minFilter: TextureParameter.Linear,
      magFilter: TextureParameter.Linear,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge
    });
    sampler.create();
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setTextureParameter("paraboloidDepthTexture", blurredRenderTarget, sampler);
          primitive.material.setParameter("pointLightShadowMapUvScale", 0.93);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setTextureParameter("paraboloidDepthTexture", blurredRenderTarget, sampler);
      material.setParameter("pointLightShadowMapUvScale", 0.93);
    }
    this.zo = { texture: blurredRenderTarget, sampler };
  }
  /**
   * Sets the depth texture index list parameter on all entity materials.
   * This parameter maps each light to its corresponding shadow map texture index.
   * @param entities - Array of scene graph entities to apply the index list to
   * @param depthTextureIndexList - Array of indices mapping lights to shadow map textures (-1 for no shadow)
   * @private
   */
  dp(entities, depthTextureIndexList, additionalMaterials = []) {
    const indexList = new VectorN(new Int32Array(depthTextureIndexList));
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter("depthTextureIndexList", indexList);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setParameter("depthTextureIndexList", indexList);
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
  Xo(lightComponent, entities) {
    const explicitFarPlane = lightComponent.pointLightShadowFarPlane;
    if (explicitFarPlane > 0) {
      return explicitFarPlane;
    }
    if (lightComponent.range > 0) {
      return lightComponent.range;
    }
    const sceneFarPlane = this.ep(lightComponent, entities);
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
  ep(lightComponent, entities) {
    const lightPositionArray = lightComponent._lightPositionForGpu._v;
    const lightPosition = {
      x: lightPositionArray[0],
      y: lightPositionArray[1],
      z: lightPositionArray[2]
    };
    let farthestDistanceSquared = 0;
    const receivers = entities.filter(
      (entity) => _ShadowSystem.Ko(entity) && !_ShadowSystem.Zo(entity)
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
    const raymarchingComponents = this.c.componentRepository.getComponentsWithType(
      RaymarchingComponent
    );
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
      return 1e3;
    }
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
  updatePointLightFarPlanes(entities, additionalMaterials = []) {
    var _a, _b;
    if (this.c.config.maxLightNumber <= 0) {
      return;
    }
    const lightComponents = this.c.componentRepository.getComponentsWithType(LightComponent);
    const pointLights = lightComponents.filter(
      (lightComponent) => lightComponent.type === LightType.Point && lightComponent.enable && lightComponent.castShadow && lightComponent._shadowSlot >= 0
    );
    if (pointLights.length === 0) {
      return;
    }
    const maxLightNumber = this.c.config.maxLightNumber;
    const newList = new Array(maxLightNumber).fill(1e3);
    for (const lightComponent of pointLights) {
      newList[lightComponent._shadowSlot] = this.Xo(lightComponent, entities);
    }
    let changed = this.vo.length !== maxLightNumber;
    if (!changed) {
      for (let i = 0; i < maxLightNumber; i++) {
        if (Math.abs(newList[i] - this.vo[i]) > 1e-4) {
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
      this.uo.setFarPlane(shadowSlot, newList[shadowSlot]);
      (_b = (_a = this.To) == null ? void 0 : _a.updatePointLightFarPlane) == null ? void 0 : _b.call(_a, shadowSlot, newList[shadowSlot]);
    }
    this.vo = newList;
    this.Yo(entities, newList, additionalMaterials);
  }
  /**
   * Sets the per-shadow-slot far planes of the paraboloid shadow maps on all entity materials.
   * @param entities - Array of scene graph entities to apply the far planes to
   * @param pointLightFarPlaneList - Far plane of each shadow slot (1000 for slots without a point light)
   * @private
   */
  Yo(entities, pointLightFarPlaneList, additionalMaterials = []) {
    const farPlaneList = new VectorN(new Float32Array(pointLightFarPlaneList));
    for (const entity of entities) {
      const meshComponent = entity.tryToGetMesh();
      if (meshComponent != null && meshComponent.mesh != null) {
        for (let i = 0; i < meshComponent.mesh.getPrimitiveNumber(); i++) {
          const primitive = meshComponent.mesh.getPrimitiveAt(i);
          primitive.material.setParameter("pointLightFarPlane", farPlaneList);
        }
      }
    }
    for (const material of additionalMaterials) {
      material.setParameter("pointLightFarPlane", farPlaneList);
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
  Wo(entities) {
    const lightComponents = this.c.componentRepository.getComponentsWithType(LightComponent);
    const spotLights = lightComponents.filter(
      (lightComponent) => lightComponent.type === LightType.Spot && lightComponent.enable && lightComponent.castShadow
    );
    if (spotLights.length === 0) {
      return;
    }
    const shadowCasters = entities.filter(
      (entity) => _ShadowSystem.Ko(entity) && !_ShadowSystem.Zo(entity)
    );
    for (const lightComponent of spotLights) {
      const lightPositionArray = lightComponent._lightPositionForGpu._v;
      const lightPosition = {
        x: lightPositionArray[0],
        y: lightPositionArray[1],
        z: lightPositionArray[2]
      };
      let nearestDistanceSquared = Number.MAX_VALUE;
      for (const entity of shadowCasters) {
        const sceneGraph = entity.getSceneGraph();
        const aabb = sceneGraph.worldMergedAABB;
        let distanceSquared;
        if (aabb != null && !aabb.isVanilla()) {
          const min = aabb.minPoint;
          const max = aabb.maxPoint;
          if (min.x <= lightPosition.x && lightPosition.x <= max.x && min.y <= lightPosition.y && lightPosition.y <= max.y && min.z <= lightPosition.z && lightPosition.z <= max.z) {
            continue;
          }
          const dx = lightPosition.x < min.x ? min.x - lightPosition.x : lightPosition.x > max.x ? lightPosition.x - max.x : 0;
          const dy = lightPosition.y < min.y ? min.y - lightPosition.y : lightPosition.y > max.y ? lightPosition.y - max.y : 0;
          const dz = lightPosition.z < min.z ? min.z - lightPosition.z : lightPosition.z > max.z ? lightPosition.z - max.z : 0;
          distanceSquared = dx * dx + dy * dy + dz * dz;
        } else {
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
      const raymarchingComponents = this.c.componentRepository.getComponentsWithType(
        RaymarchingComponent
      );
      for (const raymarchingComponent of raymarchingComponents) {
        const sceneGraph = raymarchingComponent.entity.tryToGetSceneGraph();
        if (sceneGraph == null || !sceneGraph.isVisible) {
          continue;
        }
        if (raymarchingComponent.entity.getTagValue("type") === "background-assets") {
          continue;
        }
        const aabb = sceneGraph.worldMergedAABB;
        if (aabb.isVanilla()) {
          continue;
        }
        const min = aabb.minPoint;
        const max = aabb.maxPoint;
        if (min.x <= lightPosition.x && lightPosition.x <= max.x && min.y <= lightPosition.y && lightPosition.y <= max.y && min.z <= lightPosition.z && lightPosition.z <= max.z) {
          continue;
        }
        const dx = lightPosition.x < min.x ? min.x - lightPosition.x : lightPosition.x > max.x ? lightPosition.x - max.x : 0;
        const dy = lightPosition.y < min.y ? min.y - lightPosition.y : lightPosition.y > max.y ? lightPosition.y - max.y : 0;
        const dz = lightPosition.z < min.z ? min.z - lightPosition.z : lightPosition.z > max.z ? lightPosition.z - max.z : 0;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        if (distanceSquared < nearestDistanceSquared) {
          nearestDistanceSquared = distanceSquared;
        }
      }
      let zNear = 0.1;
      if (lightComponent.range > 0 && Number.isFinite(nearestDistanceSquared)) {
        const rangeCap = Math.min(lightComponent.range * 0.05, 1);
        zNear = Math.max(0.01, Math.min(Math.sqrt(nearestDistanceSquared) * 0.5, rangeCap));
      }
      lightComponent._setShadowZNearForSpotLightAuto(zNear);
    }
  }
  static Zo(entity) {
    try {
      const getLight = entity.getLight;
      return typeof getLight === "function" && getLight.call(entity) != null;
    } catch {
      return false;
    }
  }
  /**
   * Sets the depth bias projection-view matrices for shadow mapping on all PBR materials.
   * Calculates and applies bias matrices for directional and spot lights to reduce shadow acne.
   * @param entities - Array of scene graph entities to apply the bias matrices to
   */
  setDepthBiasPV(entities, additionalMaterials = []) {
    if (this.c.config.maxLightNumber <= 0) {
      return;
    }
    this.Vo(entities);
    this.Wo(entities);
    this.updatePointLightFarPlanes(entities, additionalMaterials);
    const arrayLength = this.c.config.maxLightNumber * 16;
    let float32Array = this.Oo;
    let depthBiasPV = this.Po;
    let scratch = this.Qo;
    if (float32Array == null || depthBiasPV == null || scratch == null || float32Array.length !== arrayLength) {
      float32Array = new Float32Array(arrayLength);
      depthBiasPV = new VectorN(float32Array);
      scratch = new Float32Array(arrayLength);
      this.Oo = float32Array;
      this.Po = depthBiasPV;
      this.Qo = scratch;
      this.Eo++;
    } else {
      scratch.fill(0);
    }
    const lightComponents = this.c.componentRepository._getComponents(LightComponent);
    if (lightComponents != null) {
      const maxLightNumber = this.c.config.maxLightNumber;
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
          const lightEntity = lightComponent.entity;
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
        this.Eo++;
        break;
      }
    }
    const version = this.Eo;
    const versionOfMaterials = this.$o;
    for (let i = 0; i < entities.length; i++) {
      const meshComponent = entities[i].tryToGetMesh();
      const mesh = meshComponent == null ? void 0 : meshComponent.mesh;
      if (mesh != null) {
        const primitiveNumber = mesh.getPrimitiveNumber();
        for (let j = 0; j < primitiveNumber; j++) {
          const material = mesh.getPrimitiveAt(j).material;
          const materialUid = material.materialUID;
          if (versionOfMaterials[materialUid] === version) {
            continue;
          }
          material.setParameter("depthBiasPV", depthBiasPV);
          if (material._allFieldsInfo.has("depthBiasPV")) {
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
      material.setParameter("depthBiasPV", depthBiasPV);
      if (material._allFieldsInfo.has("depthBiasPV")) {
        versionOfMaterials[materialUid] = version;
      }
    }
  }
  /**
   * Applies the last computed shadow state (shadow maps, index list and bias matrices)
   * to materials that are assigned after getExpressions() ran, for example the
   * raymarching material of the buffer-less full-screen pass.
   */
  applyShadowParametersToMaterials(materials) {
    if (this.c.config.maxLightNumber <= 0) {
      return;
    }
    const indexList = new VectorN(
      new Int32Array(
        this.Jo.length > 0 ? this.Jo : new Array(this.c.config.maxLightNumber).fill(-1)
      )
    );
    const farPlaneList = new VectorN(
      new Float32Array(
        this.vo.length > 0 ? this.vo : new Array(this.c.config.maxLightNumber).fill(1e3)
      )
    );
    for (const material of materials) {
      material.setParameter("depthTextureIndexList", indexList);
      material.setParameter("pointLightFarPlane", farPlaneList);
      if (this.yo != null) {
        material.setTextureParameter(
          "depthTexture",
          this.yo.texture,
          this.yo.sampler
        );
      }
      if (this.zo != null) {
        material.setTextureParameter(
          "paraboloidDepthTexture",
          this.zo.texture,
          this.zo.sampler
        );
        material.setParameter("pointLightShadowMapUvScale", 0.93);
      }
    }
  }
  /**
   * Background assets (tagged `type: background-assets`, e.g. the environment cube and the grid
   * in RhodoniteEditor2) do not cast shadows. The shadow volume auto-fit excludes them as well.
   */
  static Ko(entity) {
    return entity.getTagValue("type") !== "background-assets";
  }
  Vo(entities) {
    const transformUpdateCount = TransformComponent.getUpdateCount(this.c);
    const raymarchingComponentCount = this.fp();
    const raymarchingAABBVersion = RaymarchingComponent.getAABBVersion(this.c);
    if (transformUpdateCount === this.Fo && entities.length === this.Ro && raymarchingComponentCount === this.So && raymarchingAABBVersion === this.Go) {
      this._o(this.Ho);
      return;
    }
    const candidates = entities.filter((entity) => {
      const sg = entity.getSceneGraph();
      if (!sg.isVisible) {
        return false;
      }
      const mesh = entity.tryToGetMesh();
      if (mesh == null || mesh.mesh == null) {
        return false;
      }
      if (typeof entity.matchTag === "function") {
        if (entity.matchTag("type", "background-assets")) {
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
    this.gp(merged);
    if (merged.isVanilla()) {
      return;
    }
    this.Fo = transformUpdateCount;
    this.Ro = entities.length;
    this.So = raymarchingComponentCount;
    this.Go = raymarchingAABBVersion;
    this.Ho.copyComponents(merged);
    this._o(this.Ho);
  }
  /**
   * Resets the directional/spot shadow volume fitting cache, so the next frame recomputes
   * the volume (including the SDF bounds).
   */
  invalidateShadowVolumeFitting() {
    this.Fo = -1;
    this.Go = -1;
  }
  fp() {
    const components = this.c.componentRepository.getComponentsWithType(
      RaymarchingComponent
    );
    return components.length;
  }
  /**
   * Merges the world AABBs of the visible raymarching components into `merged`.
   * The scene graph AABB of an SDF entity already contains the SDF bounds, so the cached
   * merged AABB is used instead of evaluating the graph again.
   */
  gp(merged) {
    const components = this.c.componentRepository.getComponentsWithType(
      RaymarchingComponent
    );
    for (const component of components) {
      const sceneGraph = component.entity.tryToGetSceneGraph();
      if (sceneGraph == null || !sceneGraph.isVisible) {
        continue;
      }
      if (component.entity.getTagValue("type") === "background-assets") {
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
  _o(bounds) {
    const areaMargin = 1.15;
    const nearFarMargin = 1.25;
    const lightComponents = this.c.componentRepository._getComponents(LightComponent);
    if (lightComponents == null) {
      return;
    }
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      if (lightComponent == null) continue;
      if (!(lightComponent.enable && lightComponent.castShadow)) continue;
      if (lightComponent.type !== LightType.Directional) continue;
      const lightEntity = lightComponent.entity;
      const lightWorldMatrix = lightEntity.getSceneGraph().matrixInner;
      const inverseLightMatrix = Matrix44.invert(lightWorldMatrix);
      AABB.multiplyMatrixTo(inverseLightMatrix, bounds, _ShadowSystem.Uo);
      const lightSpaceBounds = _ShadowSystem.Uo;
      const min = lightSpaceBounds.minPoint;
      const max = lightSpaceBounds.maxPoint;
      const depthNear = Math.max(-max.z, 0);
      const depthFar = Math.max(-min.z, depthNear + 1e-3);
      const zNear = Math.max(depthNear / nearFarMargin, 0.01);
      const zFar = Math.max(depthFar * nearFarMargin, zNear + 0.01);
      const halfExtent = Math.max(Math.abs(min.x), Math.abs(max.x), Math.abs(min.y), Math.abs(max.y), 1);
      const areaSize = halfExtent * areaMargin;
      lightComponent.shadowAreaSizeForDirectionalLight = areaSize;
      lightComponent.shadowZNearForDirectionalLight = zNear;
      lightComponent.range = zFar;
    }
  }
  /**
   * Checks if the light configuration has changed since the last update.
   * Compares the current light types, enable states, and shadow casting states with cached values.
   * Also returns true if a manual refresh was requested via setNeedsRefresh().
   * @returns True if any light has changed its type, enable state, or shadow casting state; false otherwise
   */
  isLightChanged() {
    if (this.Io) {
      this.Io = false;
      return true;
    }
    const lightComponents = this.c.componentRepository.getComponentsWithType(LightComponent);
    if (this.xo.length !== lightComponents.length) {
      return true;
    }
    for (let i = 0; i < lightComponents.length; i++) {
      const lightComponent = lightComponents[i];
      if (this.xo[i] !== lightComponent.type || this.Bo[i] !== lightComponent.enable || this.Co[i] !== lightComponent.castShadow || this.Do[i] !== lightComponent.componentSID) {
        return true;
      }
    }
    return false;
  }
  /**
   * Requests a refresh of shadow expressions on the next frame.
   * This is useful when materials with shadow support have been changed or added.
   */
  setNeedsRefresh() {
    this.Io = true;
  }
};
_ShadowSystem.Uo = new AABB();
var ShadowSystem = _ShadowSystem;
export {
  ShadowSystem
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vaGVscGVycy9TaGFkb3cvU2hhZG93U3lzdGVtLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IElDYW1lcmFFbnRpdHlNZXRob2RzIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DYW1lcmEvSUNhbWVyYUVudGl0eSc7XG5pbXBvcnQgdHlwZSB7IElMaWdodEVudGl0eU1ldGhvZHMgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0xpZ2h0L0lMaWdodEVudGl0eSc7XG5pbXBvcnQgeyBMaWdodENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTGlnaHQvTGlnaHRDb21wb25lbnQnO1xuaW1wb3J0IHsgUmF5bWFyY2hpbmdDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL1JheW1hcmNoaW5nL1JheW1hcmNoaW5nQ29tcG9uZW50JztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvVHJhbnNmb3JtJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IExpZ2h0VHlwZSwgdHlwZSBMaWdodFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFBpeGVsRm9ybWF0IH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUGl4ZWxGb3JtYXQnO1xuaW1wb3J0IHsgVGV4dHVyZUZvcm1hdCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1RleHR1cmVGb3JtYXQnO1xuaW1wb3J0IHsgVGV4dHVyZVBhcmFtZXRlciB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1RleHR1cmVQYXJhbWV0ZXInO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uLy4uL21hdGVyaWFscy9jb3JlL01hdGVyaWFsJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi8uLi9tYXRoL0FBQkInO1xuaW1wb3J0IHsgTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL01hdHJpeDQ0JztcbmltcG9ydCB7IFZlY3Rvck4gfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3Rvck4nO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgRXhwcmVzc2lvbiB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL0V4cHJlc3Npb24nO1xuaW1wb3J0IHR5cGUgeyBGcmFtZUJ1ZmZlciB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL0ZyYW1lQnVmZmVyJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uLy4uL3JlbmRlcmVyL1JlbmRlclBhc3MnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyVGFyZ2V0VGV4dHVyZSB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1JlbmRlclRhcmdldFRleHR1cmUnO1xuaW1wb3J0IHsgU2FtcGxlciB9IGZyb20gJy4uLy4uL3RleHR1cmVzL1NhbXBsZXInO1xuaW1wb3J0IHsgYXR0YWNoTGlnaHRTaGFkb3dDYW1lcmEsIHR5cGUgSUxpZ2h0RW50aXR5LCB0eXBlIElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vRW50aXR5SGVscGVyJztcbmltcG9ydCB7IEdhdXNzaWFuQmx1ciB9IGZyb20gJy4uL0dhdXNzaWFuQmx1ckhlbHBlcic7XG5pbXBvcnQgeyBSZW5kZXJhYmxlSGVscGVyIH0gZnJvbSAnLi4vUmVuZGVyYWJsZUhlbHBlcic7XG5pbXBvcnQgeyBQb2ludFNoYWRvd01hcCB9IGZyb20gJy4vUG9pbnRTaGFkb3dNYXAnO1xuaW1wb3J0IHsgU2hhZG93TWFwIH0gZnJvbSAnLi9TaGFkb3dNYXAnO1xuXG4vKipcbiAqIFByb3ZpZGVyIG9mIHRoZSByYXltYXJjaGluZyAoU0RGKSBzaGFkb3cgY2FzdGVyIHBhc3Nlcy5cbiAqXG4gKiBUaGUgcGlwZWxpbmUgb3ducyB0aGUgc2hhZG93IGNhc3RlciBtYXRlcmlhbHMgKHRoZXkgYXJlIGJ1aWx0IGZyb20gdGhlIG1lcmdlZCBTREZcbiAqIGdyYXBoKSBhbmQgc3VwcGxpZXMgYSBidWZmZXItbGVzcyBmdWxsLXNjcmVlbiBwYXNzIGZvciBlYWNoIHNoYWRvdyBtYXAgdmFyaWFudC4gVGhlXG4gKiBTaGFkb3dTeXN0ZW0gaW5zZXJ0cyB0aGVzZSBwYXNzZXMgYWZ0ZXIgdGhlIG1lc2ggY2FzdGVyIHBhc3NlcyBvZiB0aGUgc2FtZSBsaWdodCwgc29cbiAqIHRoZSBtb21lbnQgbWFwIGVuZHMgdXAgd2l0aCB0aGUgbmVhcmVzdCBzdXJmYWNlIG9mIHRoZSB0d28uXG4gKi9cbi8qKlxuICogUGFyYW1ldGVycyBvZiBvbmUgU0RGIHNoYWRvdyBjYXN0ZXIgcGFzcyByZXF1ZXN0LlxuICovXG5leHBvcnQgdHlwZSBSYXltYXJjaGluZ1NoYWRvd1Bhc3NQYXJhbXMgPSB7XG4gIGxpZ2h0Q29tcG9uZW50OiBMaWdodENvbXBvbmVudDtcbiAgbGlnaHRFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5ICYgSUxpZ2h0RW50aXR5TWV0aG9kcztcbiAgZnJhbWVidWZmZXI6IEZyYW1lQnVmZmVyO1xuICBraW5kOiAncmVndWxhcicgfCAncGFyYWJvbG9pZEZyb250JyB8ICdwYXJhYm9sb2lkQmFjayc7XG4gIC8qKiBUaGUgc2hhZG93IHNsb3Qgb2YgdGhlIGxpZ2h0IChpbmRleCBpbnRvIHRoZSBwZXItbWF0ZXJpYWwgcGFyYW1ldGVyIGFycmF5cykuICovXG4gIHNoYWRvd1Nsb3Q6IG51bWJlcjtcbiAgZmFyUGxhbmU/OiBudW1iZXI7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyIHtcbiAgLyoqIFdoZXRoZXIgYW55IHJheW1hcmNoaW5nIGNvbXBvbmVudCBjYXN0cyBzaGFkb3dzLiAqL1xuICBoYXNDYXN0ZXIoKTogYm9vbGVhbjtcbiAgLyoqIENyZWF0ZXMgdGhlIFNERiBjYXN0ZXIgcGFzcyhlcykgZm9yIG9uZSBzaGFkb3cgbWFwIHZhcmlhbnQuICovXG4gIGNyZWF0ZVBhc3NlcyhwYXJhbXM6IFJheW1hcmNoaW5nU2hhZG93UGFzc1BhcmFtcyk6IFJlbmRlclBhc3NbXTtcbiAgLyoqIFVwZGF0ZXMgdGhlIHBvaW50IGxpZ2h0IGZhciBwbGFuZSBvZiBhbiBleGlzdGluZyBwZXItc2xvdCBjYXN0ZXIgbWF0ZXJpYWwgcGFpci4gKi9cbiAgdXBkYXRlUG9pbnRMaWdodEZhclBsYW5lPyhzaGFkb3dTbG90OiBudW1iZXIsIGZhclBsYW5lOiBudW1iZXIpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgc3lzdGVtIGZvciBtYW5hZ2luZyBzaGFkb3cgbWFwcGluZyBvcGVyYXRpb25zIGluIHRoZSByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKiBIYW5kbGVzIGJvdGggZGlyZWN0aW9uYWwvc3BvdCBsaWdodCBzaGFkb3dzIGFuZCBwb2ludCBsaWdodCBzaGFkb3dzIHdpdGggR2F1c3NpYW4gYmx1ciBwb3N0LXByb2Nlc3NpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBTaGFkb3dTeXN0ZW0ge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgX19zaGFkb3dNYXA6IFNoYWRvd01hcDtcbiAgcHJpdmF0ZSBfX3BvaW50U2hhZG93TWFwOiBQb2ludFNoYWRvd01hcDtcbiAgcHJpdmF0ZSBfX2dhdXNzaWFuQmx1cjogR2F1c3NpYW5CbHVyO1xuICBwcml2YXRlIF9fc2hhZG93TWFwQXJyYXlGcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXI7XG4gIHByaXZhdGUgX19wb2ludFNoYWRvd01hcEFycmF5RnJhbWVidWZmZXI6IEZyYW1lQnVmZmVyO1xuICBwcml2YXRlIF9fbGlnaHRUeXBlczogTGlnaHRUeXBlRW51bVtdID0gW107XG4gIHByaXZhdGUgX19saWdodEVuYWJsZXM6IGJvb2xlYW5bXSA9IFtdO1xuICBwcml2YXRlIF9fbGlnaHRDYXN0U2hhZG93czogYm9vbGVhbltdID0gW107XG4gIHByaXZhdGUgX19saWdodFNpZHM6IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgX19pc1NoYWRvd1Nsb3RTaG9ydGFnZVdhcm5lZCA9IGZhbHNlO1xuICAvKiogUmV1c2VkIGJ5IHNldERlcHRoQmlhc1BWKCkgb24gZXZlcnkgZnJhbWUuICovXG4gIHByaXZhdGUgX19kZXB0aEJpYXNQVkFycmF5PzogRmxvYXQzMkFycmF5O1xuICBwcml2YXRlIF9fZGVwdGhCaWFzUFY/OiBWZWN0b3JOO1xuICAvKiogU2NyYXRjaCBidWZmZXIgdXNlZCB0byBkZXRlY3Qgd2hldGhlciB0aGUgYmlhcyBtYXRyaWNlcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGZyYW1lLiAqL1xuICBwcml2YXRlIF9fZGVwdGhCaWFzUFZTY3JhdGNoPzogRmxvYXQzMkFycmF5O1xuICAvKiogSW5jcmVtZW50ZWQgd2hlbmV2ZXIgdGhlIGNvbnRlbnQgb2YgdGhlIGRlcHRoIGJpYXMgbWF0cmljZXMgY2hhbmdlcy4gKi9cbiAgcHJpdmF0ZSBfX2RlcHRoQmlhc1BWVmVyc2lvbiA9IDA7XG4gIC8qKiBgX19kZXB0aEJpYXNQVlZlcnNpb25gIGxhc3Qgd3JpdHRlbiB0byBlYWNoIG1hdGVyaWFsLCBpbmRleGVkIGJ5IG1hdGVyaWFsIFVJRC4gKi9cbiAgcHJpdmF0ZSBfX2RlcHRoQmlhc1BWVmVyc2lvbk9mTWF0ZXJpYWxzOiBudW1iZXJbXSA9IFtdO1xuICBwcml2YXRlIF9fbGFzdFRyYW5zZm9ybVVwZGF0ZUNvdW50Rm9yQXV0b0ZpdCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdEVudGl0eUNvdW50Rm9yQXV0b0ZpdCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFJheW1hcmNoaW5nQ29tcG9uZW50Q291bnRGb3JBdXRvRml0ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0UmF5bWFyY2hpbmdBQUJCVmVyc2lvbkZvckF1dG9GaXQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RBdXRvRml0Qm91bmRzID0gbmV3IEFBQkIoKTtcbiAgcHJpdmF0ZSBfX25lZWRzUmVmcmVzaCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcmF5bWFyY2hpbmdTaGFkb3dQYXNzUHJvdmlkZXI/OiBSYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlcjtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBMaWdodFNwYWNlQm91bmRzID0gbmV3IEFBQkIoKTtcbiAgLyoqIExhc3Qgc2hhZG93IHN0YXRlLCBzbyBhIG1hdGVyaWFsIGFzc2lnbmVkIGxhdGVyIChlLmcuIHRoZSByYXltYXJjaGluZyBtYXRlcmlhbCkgY2FuIHJlY2VpdmUgaXQuICovXG4gIHByaXZhdGUgX19kZXB0aFRleHR1cmVJbmRleExpc3Q6IG51bWJlcltdID0gW107XG4gIC8qKiBGYXIgcGxhbmUgb2YgdGhlIHBhcmFib2xvaWQgc2hhZG93IG1hcCBvZiBlYWNoIHNoYWRvdyBzbG90IChpbmRleGVkIGJ5IHNsb3QpLiAqL1xuICBwcml2YXRlIF9fcG9pbnRMaWdodEZhclBsYW5lTGlzdDogbnVtYmVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfX2RpcmVjdGlvbmFsU2hhZG93TWFwPzogeyB0ZXh0dXJlOiBSZW5kZXJUYXJnZXRUZXh0dXJlOyBzYW1wbGVyOiBTYW1wbGVyIH07XG4gIHByaXZhdGUgX19wYXJhYm9sb2lkU2hhZG93TWFwPzogeyB0ZXh0dXJlOiBSZW5kZXJUYXJnZXRUZXh0dXJlOyBzYW1wbGVyOiBTYW1wbGVyIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU2hhZG93U3lzdGVtIGluc3RhbmNlIHdpdGggdGhlIHNwZWNpZmllZCBzaGFkb3cgbWFwIHJlc29sdXRpb24uXG4gICAqIEluaXRpYWxpemVzIHNoYWRvdyBtYXAgYW5kIHBvaW50IHNoYWRvdyBtYXAgc3lzdGVtcywgYWxvbmcgd2l0aCBmcmFtZWJ1ZmZlcnMgZm9yIHRleHR1cmUgYXJyYXlzLlxuICAgKiBAcGFyYW0gc2hhZG93TWFwU2l6ZSAtIFRoZSByZXNvbHV0aW9uICh3aWR0aCBhbmQgaGVpZ2h0KSBvZiBzaGFkb3cgbWFwcyBpbiBwaXhlbHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lLCBzaGFkb3dNYXBTaXplOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIHRoaXMuX19zaGFkb3dNYXAgPSBuZXcgU2hhZG93TWFwKGVuZ2luZSk7XG4gICAgdGhpcy5fX3BvaW50U2hhZG93TWFwID0gbmV3IFBvaW50U2hhZG93TWFwKGVuZ2luZSk7XG4gICAgdGhpcy5fX2dhdXNzaWFuQmx1ciA9IG5ldyBHYXVzc2lhbkJsdXIoZW5naW5lKTtcblxuICAgIGNvbnN0IFtzaGFkb3dNYXBBcnJheUZyYW1lYnVmZmVyLCBfc2hhZG93TWFwQXJyYXlSZW5kZXJUYXJnZXRUZXh0dXJlXSA9XG4gICAgICBSZW5kZXJhYmxlSGVscGVyLmNyZWF0ZUZyYW1lQnVmZmVyVGV4dHVyZUFycmF5KGVuZ2luZSwge1xuICAgICAgICB3aWR0aDogc2hhZG93TWFwU2l6ZSxcbiAgICAgICAgaGVpZ2h0OiBzaGFkb3dNYXBTaXplLFxuICAgICAgICBhcnJheUxlbmd0aDogZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlck9yT25lLFxuICAgICAgICBsZXZlbDogMCxcbiAgICAgICAgaW50ZXJuYWxGb3JtYXQ6IFRleHR1cmVGb3JtYXQuUkcxNkYsXG4gICAgICAgIGZvcm1hdDogUGl4ZWxGb3JtYXQuUkcsXG4gICAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICB9KTtcbiAgICB0aGlzLl9fc2hhZG93TWFwQXJyYXlGcmFtZWJ1ZmZlciA9IHNoYWRvd01hcEFycmF5RnJhbWVidWZmZXI7XG5cbiAgICBjb25zdCBbcG9pbnRTaGFkb3dNYXBBcnJheUZyYW1lYnVmZmVyLCBfcG9pbnRTaGFkb3dNYXBBcnJheVJlbmRlclRhcmdldFRleHR1cmVdID1cbiAgICAgIFJlbmRlcmFibGVIZWxwZXIuY3JlYXRlRnJhbWVCdWZmZXJUZXh0dXJlQXJyYXkoZW5naW5lLCB7XG4gICAgICAgIHdpZHRoOiBzaGFkb3dNYXBTaXplLFxuICAgICAgICBoZWlnaHQ6IHNoYWRvd01hcFNpemUsXG4gICAgICAgIGFycmF5TGVuZ3RoOiBlbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyT3JPbmUsXG4gICAgICAgIGxldmVsOiAwLFxuICAgICAgICBpbnRlcm5hbEZvcm1hdDogVGV4dHVyZUZvcm1hdC5SR0JBMTZGLFxuICAgICAgICBmb3JtYXQ6IFBpeGVsRm9ybWF0LlJHQkEsXG4gICAgICAgIHR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gICAgICB9KTtcbiAgICB0aGlzLl9fcG9pbnRTaGFkb3dNYXBBcnJheUZyYW1lYnVmZmVyID0gcG9pbnRTaGFkb3dNYXBBcnJheUZyYW1lYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyByZW5kZXJpbmcgZXhwcmVzc2lvbnMgZm9yIHNoYWRvdyBtYXBwaW5nIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBlbnRpdGllcyBhbmQgYWN0aXZlIGxpZ2h0cy5cbiAgICogQ3JlYXRlcyBzaGFkb3cgbWFwIHJlbmRlciBwYXNzZXMgZm9yIGVhY2ggc2hhZG93LWNhc3RpbmcgbGlnaHQgYW5kIGFwcGxpZXMgR2F1c3NpYW4gYmx1ciBwb3N0LXByb2Nlc3NpbmcuXG4gICAqIEBwYXJhbSBlbnRpdGllcyAtIEFycmF5IG9mIHNjZW5lIGdyYXBoIGVudGl0aWVzIHRvIGJlIHJlbmRlcmVkIGZvciBzaGFkb3cgbWFwcGluZ1xuICAgKiBAcmV0dXJucyBBcnJheSBvZiBFeHByZXNzaW9uIG9iamVjdHMgY29udGFpbmluZyB0aGUgc2hhZG93IG1hcHBpbmcgcmVuZGVyIHBhc3Nlc1xuICAgKi9cbiAgcHVibGljIGdldEV4cHJlc3Npb25zKFxuICAgIGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIGFkZGl0aW9uYWxNYXRlcmlhbHM6IHJlYWRvbmx5IE1hdGVyaWFsW10gPSBbXSxcbiAgICByYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlcj86IFJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyXG4gICkge1xuICAgIHRoaXMuX19yYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlciA9IHJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyO1xuICAgIC8vIFdpdGggbm8gc2hhZG93IHNsb3RzIHRoZXJlIGlzIG5vdGhpbmcgdG8gcmVuZGVyIGludG8gdGhlIHNoYWRvdyBtYXBzLCBhbmQgdGhlIG1hdGVyaWFscyBoYXZlIG5vXG4gICAgLy8gc2hhZG93IHBhcmFtZXRlcnMgKENvbmZpZy5tYXhMaWdodE51bWJlciA9IDAgY29tcGlsZXMgdGhlIHNoYWRvdyBjb2RlIG91dCkuXG4gICAgaWYgKHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyIDw9IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvLyBBdXRvLWZpdCBEaXJlY3Rpb25hbExpZ2h0IHNoYWRvdyBjYW1lcmEgdm9sdW1lIGJlZm9yZSBzZXR0aW5nIHVwIHNoYWRvdyBtYXAgcmVuZGVyIHBhc3Nlcy5cbiAgICAvLyBUaGlzIGVuc3VyZXMgdGhlIHNoYWRvdyBjYW1lcmEgY292ZXJzIHRoZSBlbnRpcmUgc2NlbmUgd2hlbiByZW5kZXJpbmcgdGhlIHNoYWRvdyBtYXAuXG4gICAgdGhpcy5fX2F1dG9GaXREaXJlY3Rpb25hbExpZ2h0U2hhZG93Vm9sdW1lKGVudGl0aWVzKTtcbiAgICB0aGlzLl9fdXBkYXRlU3BvdExpZ2h0U2hhZG93Wk5lYXIoZW50aXRpZXMpO1xuXG4gICAgLy8gT25seSB0aGVzZSBlbnRpdGllcyBhcmUgcmVuZGVyZWQgaW50byB0aGUgc2hhZG93IG1hcHMuIEV2ZXJ5IGVudGl0eSBzdGlsbCByZWNlaXZlcyBzaGFkb3dzLFxuICAgIC8vIHNvIGBlbnRpdGllc2Aga2VlcHMgYmVpbmcgdXNlZCBmb3IgdGhlIG1hdGVyaWFsIHNldHVwIGJlbG93LlxuICAgIGNvbnN0IHNoYWRvd0Nhc3RlcnMgPSBlbnRpdGllcy5maWx0ZXIoU2hhZG93U3lzdGVtLl9faXNTaGFkb3dDYXN0ZXIpO1xuXG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSBbXTtcbiAgICAvLyBUaGUgc2hhZG93IGRhdGEgb2YgYSBsaWdodCBpcyBzdG9yZWQgYXQgaXRzIHNoYWRvdyBzbG90LCBzbyB0aGUgbGlzdCBpcyBpbmRleGVkIGJ5IHRoZSBzbG90LlxuICAgIGNvbnN0IGRlcHRoVGV4dHVyZUluZGV4TGlzdDogbnVtYmVyW10gPSBuZXcgQXJyYXkodGhpcy5fX2VuZ2luZS5jb25maWcubWF4TGlnaHROdW1iZXIpLmZpbGwoLTEpO1xuICAgIGNvbnN0IHBvaW50TGlnaHRGYXJQbGFuZUxpc3Q6IG51bWJlcltdID0gbmV3IEFycmF5KHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyKS5maWxsKDEwMDApO1xuXG4gICAgbGV0IGRlcHRoVGV4dHVyZUNvdW50ID0gMDtcbiAgICBsZXQgcG9pbnREZXB0aFRleHR1cmVDb3VudCA9IDA7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShMaWdodENvbXBvbmVudCkgYXMgTGlnaHRDb21wb25lbnRbXTtcbiAgICB0aGlzLl9fbGlnaHRUeXBlcy5sZW5ndGggPSBsaWdodENvbXBvbmVudHMubGVuZ3RoO1xuICAgIHRoaXMuX19saWdodEVuYWJsZXMubGVuZ3RoID0gbGlnaHRDb21wb25lbnRzLmxlbmd0aDtcbiAgICB0aGlzLl9fbGlnaHRDYXN0U2hhZG93cy5sZW5ndGggPSBsaWdodENvbXBvbmVudHMubGVuZ3RoO1xuICAgIHRoaXMuX19saWdodFNpZHMubGVuZ3RoID0gbGlnaHRDb21wb25lbnRzLmxlbmd0aDtcbiAgICB0aGlzLl9fYXNzaWduU2hhZG93U2xvdHMoXG4gICAgICBsaWdodENvbXBvbmVudHMsXG4gICAgICBzaGFkb3dDYXN0ZXJzLmxlbmd0aCA+IDAgfHwgKHJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyPy5oYXNDYXN0ZXIoKSA/PyBmYWxzZSlcbiAgICApO1xuICAgIC8vIEEgc3BvdCBvciBkaXJlY3Rpb25hbCBsaWdodCByZW5kZXJzIGl0cyBzaGFkb3cgbWFwIGZyb20gYSBjYW1lcmEgc3luY2hyb25pemVkIHRvIGl0LiBJbXBvcnRlZCBsaWdodHMgb25seVxuICAgIC8vIGdldCBvbmUgd2hlbiB0aGV5IGNhc3Qgc2hhZG93cyAoTW9kZWxDb252ZXJ0ZXIpLCBzbyBhdHRhY2ggaXQgaGVyZSBmb3IgdGhlIGxpZ2h0cyB0aGF0IHN0YXJ0ZWQgY2FzdGluZ1xuICAgIC8vIHNoYWRvd3MgbGF0ZXIgKGUuZy4gZW5hYmxlZCBpbiB0aGUgZWRpdG9yKS5cbiAgICBmb3IgKGNvbnN0IGxpZ2h0Q29tcG9uZW50IG9mIGxpZ2h0Q29tcG9uZW50cykge1xuICAgICAgaWYgKGxpZ2h0Q29tcG9uZW50Ll9zaGFkb3dTbG90ID49IDApIHtcbiAgICAgICAgYXR0YWNoTGlnaHRTaGFkb3dDYW1lcmEodGhpcy5fX2VuZ2luZSwgbGlnaHRDb21wb25lbnQuZW50aXR5IGFzIElMaWdodEVudGl0eSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlnaHRDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBsaWdodENvbXBvbmVudCA9IGxpZ2h0Q29tcG9uZW50c1tpXTtcbiAgICAgIHRoaXMuX19saWdodFR5cGVzW2ldID0gbGlnaHRDb21wb25lbnQudHlwZTtcbiAgICAgIHRoaXMuX19saWdodEVuYWJsZXNbaV0gPSBsaWdodENvbXBvbmVudC5lbmFibGU7XG4gICAgICB0aGlzLl9fbGlnaHRDYXN0U2hhZG93c1tpXSA9IGxpZ2h0Q29tcG9uZW50LmNhc3RTaGFkb3c7XG4gICAgICB0aGlzLl9fbGlnaHRTaWRzW2ldID0gbGlnaHRDb21wb25lbnQuY29tcG9uZW50U0lEO1xuXG4gICAgICBjb25zdCBzaGFkb3dTbG90ID0gbGlnaHRDb21wb25lbnQuX3NoYWRvd1Nsb3Q7XG4gICAgICBpZiAoc2hhZG93U2xvdCA8IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuUG9pbnQpIHtcbiAgICAgICAgY29uc3QgZmFyUGxhbmUgPSB0aGlzLl9fZ2V0UG9pbnRMaWdodEZhclBsYW5lKGxpZ2h0Q29tcG9uZW50LCBlbnRpdGllcyk7XG4gICAgICAgIGNvbnN0IHNoYWRvd01hcEV4cHJlc3Npb24gPSBuZXcgRXhwcmVzc2lvbigpO1xuICAgICAgICBjb25zdCBwb2ludFNoYWRvd01hcFJlbmRlclBhc3NlcyA9IHRoaXMuX19wb2ludFNoYWRvd01hcC5nZXRSZW5kZXJQYXNzZXMoXG4gICAgICAgICAgc2hhZG93Q2FzdGVycyxcbiAgICAgICAgICBsaWdodENvbXBvbmVudC5lbnRpdHkgYXMgSVNjZW5lR3JhcGhFbnRpdHkgJiBJTGlnaHRFbnRpdHlNZXRob2RzLFxuICAgICAgICAgIHNoYWRvd1Nsb3QsXG4gICAgICAgICAgZmFyUGxhbmVcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVGhlIFNERiBjYXN0ZXIgcGFzc2VzIG11c3QgYmUgaW5zZXJ0ZWQgYmV0d2VlbiB0aGUgZnJvbnQgYW5kIGJhY2sgbWVzaCBwYXNzZXMsXG4gICAgICAgIC8vIGJlY2F1c2UgdGhlIGJhY2sgbWVzaCBwYXNzIGNsZWFycyB0aGUgZGVwdGggYnVmZmVyIGFnYWluLiBUaGUgU0RGIHBhc3Mgd3JpdGVzXG4gICAgICAgIC8vIGRlcHRoLXRlc3RpbmcgbW9tZW50cyBzbyB0aGUgbmVhcmVzdCBvZiB0aGUgbWVzaCBhbmQgU0RGIHN1cmZhY2VzIGlzIGtlcHQuXG4gICAgICAgIGNvbnN0IGZyb250Q2FzdGVyUGFzc2VzID1cbiAgICAgICAgICByYXltYXJjaGluZ1NoYWRvd1Bhc3NQcm92aWRlcj8uY3JlYXRlUGFzc2VzKHtcbiAgICAgICAgICAgIGxpZ2h0Q29tcG9uZW50LFxuICAgICAgICAgICAgbGlnaHRFbnRpdHk6IGxpZ2h0Q29tcG9uZW50LmVudGl0eSBhcyBJU2NlbmVHcmFwaEVudGl0eSAmIElMaWdodEVudGl0eU1ldGhvZHMsXG4gICAgICAgICAgICBmcmFtZWJ1ZmZlcjogdGhpcy5fX3BvaW50U2hhZG93TWFwLmdldFNoYWRvd01vbWVudEZyYW1lYnVmZmVyKCksXG4gICAgICAgICAgICBraW5kOiAncGFyYWJvbG9pZEZyb250JyxcbiAgICAgICAgICAgIHNoYWRvd1Nsb3QsXG4gICAgICAgICAgICBmYXJQbGFuZSxcbiAgICAgICAgICB9KSA/PyBbXTtcbiAgICAgICAgY29uc3QgYmFja0Nhc3RlclBhc3NlcyA9XG4gICAgICAgICAgcmF5bWFyY2hpbmdTaGFkb3dQYXNzUHJvdmlkZXI/LmNyZWF0ZVBhc3Nlcyh7XG4gICAgICAgICAgICBsaWdodENvbXBvbmVudCxcbiAgICAgICAgICAgIGxpZ2h0RW50aXR5OiBsaWdodENvbXBvbmVudC5lbnRpdHkgYXMgSVNjZW5lR3JhcGhFbnRpdHkgJiBJTGlnaHRFbnRpdHlNZXRob2RzLFxuICAgICAgICAgICAgZnJhbWVidWZmZXI6IHRoaXMuX19wb2ludFNoYWRvd01hcC5nZXRTaGFkb3dNb21lbnRGcmFtZWJ1ZmZlcigpLFxuICAgICAgICAgICAga2luZDogJ3BhcmFib2xvaWRCYWNrJyxcbiAgICAgICAgICAgIHNoYWRvd1Nsb3QsXG4gICAgICAgICAgICBmYXJQbGFuZSxcbiAgICAgICAgICB9KSA/PyBbXTtcbiAgICAgICAgc2hhZG93TWFwRXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMoW1xuICAgICAgICAgIHBvaW50U2hhZG93TWFwUmVuZGVyUGFzc2VzWzBdLFxuICAgICAgICAgIC4uLmZyb250Q2FzdGVyUGFzc2VzLFxuICAgICAgICAgIHBvaW50U2hhZG93TWFwUmVuZGVyUGFzc2VzWzFdLFxuICAgICAgICAgIC4uLmJhY2tDYXN0ZXJQYXNzZXMsXG4gICAgICAgIF0pO1xuICAgICAgICBleHByZXNzaW9ucy5wdXNoKHNoYWRvd01hcEV4cHJlc3Npb24pO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgYmx1ckV4cHJlc3Npb246IGJsdXJFeHByZXNzaW9uUG9pbnRMaWdodCxcbiAgICAgICAgICBibHVycmVkUmVuZGVyVGFyZ2V0OiBibHVycmVkUmVuZGVyVGFyZ2V0UG9pbnRMaWdodCxcbiAgICAgICAgICByZW5kZXJQYXNzZXNCbHVycmVkOiBfcmVuZGVyUGFzc2VzQmx1cnJlZFBvaW50TGlnaHQsXG4gICAgICAgIH0gPSB0aGlzLl9fZ2F1c3NpYW5CbHVyLmNyZWF0ZUdhdXNzaWFuQmx1ckV4cHJlc3Npb24oe1xuICAgICAgICAgIHRleHR1cmVUb0JsdXI6IHRoaXMuX19wb2ludFNoYWRvd01hcC5nZXRTaGFkb3dNb21lbnRGcmFtZWJ1ZmZlcigpLmdldENvbG9yQXR0YWNoZWRSZW5kZXJUYXJnZXRUZXh0dXJlKDApISxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICBibHVyUGFzc0xldmVsOiAzLFxuICAgICAgICAgICAgZ2F1c3NpYW5LZXJuZWxTaXplOiA1LFxuICAgICAgICAgICAgZ2F1c3NpYW5WYXJpYW5jZTogNSxcbiAgICAgICAgICAgIHN5bnRoZXNpemVDb2VmZmljaWVudDogWzEuMCAvIDQsIDEuMCAvIDQsIDEuMCAvIDQsIDEuMCAvIDQsIDEuMCAvIDQsIDEuMCAvIDRdLFxuICAgICAgICAgICAgaXNSZWR1Y2VCdWZmZXI6IHRydWUsXG4gICAgICAgICAgICB0ZXh0dXJlRm9ybWF0OiBUZXh0dXJlRm9ybWF0LlJHQkExNkYsXG4gICAgICAgICAgICBvdXRwdXRGcmFtZUJ1ZmZlcjogdGhpcy5fX3BvaW50U2hhZG93TWFwQXJyYXlGcmFtZWJ1ZmZlcixcbiAgICAgICAgICAgIG91dHB1dEZyYW1lQnVmZmVyTGF5ZXJJbmRleDogcG9pbnREZXB0aFRleHR1cmVDb3VudCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fX3NldFBhcmFib2xvaWRCbHVycmVkU2hhZG93TWFwKGJsdXJyZWRSZW5kZXJUYXJnZXRQb2ludExpZ2h0LCBlbnRpdGllcywgYWRkaXRpb25hbE1hdGVyaWFscyk7XG4gICAgICAgIGV4cHJlc3Npb25zLnB1c2goYmx1ckV4cHJlc3Npb25Qb2ludExpZ2h0KTtcbiAgICAgICAgZGVwdGhUZXh0dXJlSW5kZXhMaXN0W3NoYWRvd1Nsb3RdID0gcG9pbnREZXB0aFRleHR1cmVDb3VudDtcbiAgICAgICAgcG9pbnRMaWdodEZhclBsYW5lTGlzdFtzaGFkb3dTbG90XSA9IGZhclBsYW5lO1xuICAgICAgICBwb2ludERlcHRoVGV4dHVyZUNvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5TcG90IHx8IGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCkge1xuICAgICAgICBjb25zdCBzaGFkb3dNYXBFeHByZXNzaW9uID0gbmV3IEV4cHJlc3Npb24oKTtcbiAgICAgICAgY29uc3Qgc2hhZG93TWFwUmVuZGVyUGFzc2VzID0gdGhpcy5fX3NoYWRvd01hcC5nZXRSZW5kZXJQYXNzZXMoXG4gICAgICAgICAgc2hhZG93Q2FzdGVycyxcbiAgICAgICAgICBsaWdodENvbXBvbmVudC5lbnRpdHkgYXMgSVNjZW5lR3JhcGhFbnRpdHkgJiBJTGlnaHRFbnRpdHlNZXRob2RzICYgSUNhbWVyYUVudGl0eU1ldGhvZHNcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVGhlIFNERiBjYXN0ZXIgcGFzcyBydW5zIGFmdGVyIHRoZSBtZXNoIGNhc3RlciBwYXNzIGFuZCBkZXB0aC10ZXN0cyBhZ2FpbnN0IHRoZVxuICAgICAgICAvLyBtZXNoIGRlcHRoLCBzbyB0aGUgbW9tZW50IG1hcCBrZWVwcyB0aGUgbmVhcmVzdCBvZiB0aGUgdHdvIHN1cmZhY2VzLlxuICAgICAgICBjb25zdCBjYXN0ZXJQYXNzZXMgPVxuICAgICAgICAgIHJheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyPy5jcmVhdGVQYXNzZXMoe1xuICAgICAgICAgICAgbGlnaHRDb21wb25lbnQsXG4gICAgICAgICAgICBsaWdodEVudGl0eTogbGlnaHRDb21wb25lbnQuZW50aXR5IGFzIElTY2VuZUdyYXBoRW50aXR5ICYgSUxpZ2h0RW50aXR5TWV0aG9kcyxcbiAgICAgICAgICAgIGZyYW1lYnVmZmVyOiB0aGlzLl9fc2hhZG93TWFwLmdldFNoYWRvd01vbWVudEZyYW1lYnVmZmVyKCksXG4gICAgICAgICAgICBraW5kOiAncmVndWxhcicsXG4gICAgICAgICAgICBzaGFkb3dTbG90LFxuICAgICAgICAgIH0pID8/IFtdO1xuICAgICAgICBzaGFkb3dNYXBFeHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbLi4uc2hhZG93TWFwUmVuZGVyUGFzc2VzLCAuLi5jYXN0ZXJQYXNzZXNdKTtcbiAgICAgICAgZXhwcmVzc2lvbnMucHVzaChzaGFkb3dNYXBFeHByZXNzaW9uKTtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIGJsdXJFeHByZXNzaW9uOiBibHVyRXhwcmVzc2lvblNwb3RMaWdodCxcbiAgICAgICAgICBibHVycmVkUmVuZGVyVGFyZ2V0OiBibHVycmVkUmVuZGVyVGFyZ2V0U3BvdExpZ2h0LFxuICAgICAgICAgIHJlbmRlclBhc3Nlc0JsdXJyZWQ6IF9yZW5kZXJQYXNzZXNCbHVycmVkU3BvdExpZ2h0LFxuICAgICAgICB9ID0gdGhpcy5fX2dhdXNzaWFuQmx1ci5jcmVhdGVHYXVzc2lhbkJsdXJFeHByZXNzaW9uKHtcbiAgICAgICAgICB0ZXh0dXJlVG9CbHVyOiB0aGlzLl9fc2hhZG93TWFwLmdldFNoYWRvd01vbWVudEZyYW1lYnVmZmVyKCkuZ2V0Q29sb3JBdHRhY2hlZFJlbmRlclRhcmdldFRleHR1cmUoMCkhLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGJsdXJQYXNzTGV2ZWw6IDMsXG4gICAgICAgICAgICBnYXVzc2lhbktlcm5lbFNpemU6IDUsXG4gICAgICAgICAgICBnYXVzc2lhblZhcmlhbmNlOiA1LFxuICAgICAgICAgICAgc3ludGhlc2l6ZUNvZWZmaWNpZW50OiBbMS4wIC8gNCwgMS4wIC8gNCwgMS4wIC8gNCwgMS4wIC8gNCwgMS4wIC8gNCwgMS4wIC8gNF0sXG4gICAgICAgICAgICBpc1JlZHVjZUJ1ZmZlcjogdHJ1ZSxcbiAgICAgICAgICAgIHRleHR1cmVGb3JtYXQ6IFRleHR1cmVGb3JtYXQuUkcxNkYsXG4gICAgICAgICAgICBvdXRwdXRGcmFtZUJ1ZmZlcjogdGhpcy5fX3NoYWRvd01hcEFycmF5RnJhbWVidWZmZXIsXG4gICAgICAgICAgICBvdXRwdXRGcmFtZUJ1ZmZlckxheWVySW5kZXg6IGRlcHRoVGV4dHVyZUNvdW50LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9fc2V0Qmx1cnJlZFNoYWRvd01hcChibHVycmVkUmVuZGVyVGFyZ2V0U3BvdExpZ2h0LCBlbnRpdGllcywgYWRkaXRpb25hbE1hdGVyaWFscyk7XG4gICAgICAgIGV4cHJlc3Npb25zLnB1c2goYmx1ckV4cHJlc3Npb25TcG90TGlnaHQpO1xuICAgICAgICBkZXB0aFRleHR1cmVJbmRleExpc3Rbc2hhZG93U2xvdF0gPSBkZXB0aFRleHR1cmVDb3VudDtcbiAgICAgICAgZGVwdGhUZXh0dXJlQ291bnQrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9fZGVwdGhUZXh0dXJlSW5kZXhMaXN0ID0gZGVwdGhUZXh0dXJlSW5kZXhMaXN0O1xuICAgIHRoaXMuX19zZXREZXB0aFRleHR1cmVJbmRleExpc3QoZW50aXRpZXMsIGRlcHRoVGV4dHVyZUluZGV4TGlzdCwgYWRkaXRpb25hbE1hdGVyaWFscyk7XG4gICAgdGhpcy5fX3BvaW50TGlnaHRGYXJQbGFuZUxpc3QgPSBwb2ludExpZ2h0RmFyUGxhbmVMaXN0O1xuICAgIHRoaXMuX19zZXRQb2ludExpZ2h0RmFyUGxhbmVMaXN0KGVudGl0aWVzLCBwb2ludExpZ2h0RmFyUGxhbmVMaXN0LCBhZGRpdGlvbmFsTWF0ZXJpYWxzKTtcblxuICAgIHJldHVybiBleHByZXNzaW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ25zIHRoZSBzaGFkb3cgc2xvdHMgKHRoZSBpbmRpY2VzIG9mIHRoZSBwZXItbWF0ZXJpYWwgc2hhZG93IGFycmF5cykgdG8gdGhlIGxpZ2h0cy5cbiAgICpcbiAgICogQSBzaGFkb3cgY2FzdGluZyBsaWdodCBrZWVwcyB0aGUgc2xvdCBlcXVhbCB0byBpdHMgY29tcG9uZW50IFNJRCB3aGVuIHRoZSBTSUQgaXMgYmVsb3dcbiAgICogYENvbmZpZy5tYXhMaWdodE51bWJlcmAgKHRoZSBjb252ZW50aW9uIG9mIG1hbnVhbCBzaGFkb3cgbWFwIHNldHVwcyksIGFuZCB0aGUgb3RoZXIgc2hhZG93IGNhc3RpbmcgbGlnaHRzXG4gICAqIHVzZSB0aGUgZnJlZSBzbG90cy4gTGlnaHRzIHRoYXQgZG8gbm90IGNhc3Qgc2hhZG93cyBnZXQgbm8gc2xvdC5cbiAgICpcbiAgICogQHBhcmFtIGxpZ2h0Q29tcG9uZW50cyAtIFRoZSBsaXZlIGxpZ2h0IGNvbXBvbmVudHNcbiAgICogQHBhcmFtIGhhc1NoYWRvd0Nhc3RlcnMgLSBXaGV0aGVyIGFueSBlbnRpdHkgaXMgcmVuZGVyZWQgdG8gdGhlIHNoYWRvdyBtYXBzXG4gICAqL1xuICBwcml2YXRlIF9fYXNzaWduU2hhZG93U2xvdHMobGlnaHRDb21wb25lbnRzOiBMaWdodENvbXBvbmVudFtdLCBoYXNTaGFkb3dDYXN0ZXJzOiBib29sZWFuKSB7XG4gICAgY29uc3QgbWF4TGlnaHROdW1iZXIgPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlcjtcbiAgICBjb25zdCBpc1Nsb3RVc2VkOiBib29sZWFuW10gPSBuZXcgQXJyYXkobWF4TGlnaHROdW1iZXIpLmZpbGwoZmFsc2UpO1xuICAgIGNvbnN0IGNhc3RzU2hhZG93ID0gKGxpZ2h0Q29tcG9uZW50OiBMaWdodENvbXBvbmVudCkgPT5cbiAgICAgIC8vIFdpdGhvdXQgYW55IHNoYWRvdyBjYXN0ZXIgdGhlIHNoYWRvdyBtYXAgd291bGQgc3RheSBlbXB0eSwgc28gdGhlIHNoYWRvdyBtYXAgYW5kIGJsdXJcbiAgICAgIC8vIHBhc3NlcyBhcmUgbm90IGNyZWF0ZWQgYXQgYWxsIGFuZCB0aGUgbGlnaHQgaXMgdHJlYXRlZCBhcyBub3QgY2FzdGluZyBzaGFkb3dzLlxuICAgICAgaGFzU2hhZG93Q2FzdGVycyAmJlxuICAgICAgbGlnaHRDb21wb25lbnQuZW5hYmxlICYmXG4gICAgICBsaWdodENvbXBvbmVudC5jYXN0U2hhZG93ICYmXG4gICAgICAobGlnaHRDb21wb25lbnQudHlwZSA9PT0gTGlnaHRUeXBlLlBvaW50IHx8XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5TcG90IHx8XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCk7XG5cbiAgICBmb3IgKGNvbnN0IGxpZ2h0Q29tcG9uZW50IG9mIGxpZ2h0Q29tcG9uZW50cykge1xuICAgICAgY29uc3Qgc2lkID0gbGlnaHRDb21wb25lbnQuY29tcG9uZW50U0lEO1xuICAgICAgaWYgKGNhc3RzU2hhZG93KGxpZ2h0Q29tcG9uZW50KSAmJiBzaWQgPCBtYXhMaWdodE51bWJlcikge1xuICAgICAgICBsaWdodENvbXBvbmVudC5fc2hhZG93U2xvdCA9IHNpZDtcbiAgICAgICAgaXNTbG90VXNlZFtzaWRdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpZ2h0Q29tcG9uZW50Ll9zaGFkb3dTbG90ID0gLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgbGlnaHRDb21wb25lbnQgb2YgbGlnaHRDb21wb25lbnRzKSB7XG4gICAgICBpZiAoIWNhc3RzU2hhZG93KGxpZ2h0Q29tcG9uZW50KSB8fCBsaWdodENvbXBvbmVudC5jb21wb25lbnRTSUQgPCBtYXhMaWdodE51bWJlcikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZyZWVTbG90ID0gaXNTbG90VXNlZC5pbmRleE9mKGZhbHNlKTtcbiAgICAgIGlmIChmcmVlU2xvdCA8IDApIHtcbiAgICAgICAgaWYgKCF0aGlzLl9faXNTaGFkb3dTbG90U2hvcnRhZ2VXYXJuZWQpIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAgICAgYFNoYWRvd1N5c3RlbTogTW9yZSB0aGFuIENvbmZpZy5tYXhMaWdodE51bWJlciAoJHttYXhMaWdodE51bWJlcn0pIGxpZ2h0cyBjYXN0IHNoYWRvd3MuIFRoZSBvdGhlciBsaWdodHMgZG8gbm90IGNhc3Qgc2hhZG93cy5gXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLl9faXNTaGFkb3dTbG90U2hvcnRhZ2VXYXJuZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbGlnaHRDb21wb25lbnQuX3NoYWRvd1Nsb3QgPSBmcmVlU2xvdDtcbiAgICAgIGlzU2xvdFVzZWRbZnJlZVNsb3RdID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYmx1cnJlZCBzaGFkb3cgbWFwIHRleHR1cmUgZm9yIGRpcmVjdGlvbmFsIGFuZCBzcG90IGxpZ2h0cyBvbiBhbGwgZW50aXR5IG1hdGVyaWFscy5cbiAgICogQ3JlYXRlcyBhIGxpbmVhciBzYW1wbGVyIGFuZCBhc3NpZ25zIHRoZSBzaGFkb3cgbWFwIHRleHR1cmUgdG8gdGhlICdkZXB0aFRleHR1cmUnIHBhcmFtZXRlci5cbiAgICogQHBhcmFtIGJsdXJyZWRSZW5kZXJUYXJnZXQgLSBUaGUgYmx1cnJlZCBzaGFkb3cgbWFwIHJlbmRlciB0YXJnZXQgdGV4dHVyZVxuICAgKiBAcGFyYW0gZW50aXRpZXMgLSBBcnJheSBvZiBzY2VuZSBncmFwaCBlbnRpdGllcyB0byBhcHBseSB0aGUgc2hhZG93IG1hcCB0b1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldEJsdXJyZWRTaGFkb3dNYXAoXG4gICAgYmx1cnJlZFJlbmRlclRhcmdldDogUmVuZGVyVGFyZ2V0VGV4dHVyZSxcbiAgICBlbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBhZGRpdGlvbmFsTWF0ZXJpYWxzOiByZWFkb25seSBNYXRlcmlhbFtdID0gW11cbiAgKSB7XG4gICAgY29uc3Qgc2FtcGxlciA9IG5ldyBTYW1wbGVyKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgIG1pbkZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICB9KTtcbiAgICBzYW1wbGVyLmNyZWF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgICBpZiAobWVzaENvbXBvbmVudCAhPSBudWxsICYmIG1lc2hDb21wb25lbnQubWVzaCAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudC5tZXNoLmdldFByaW1pdGl2ZU51bWJlcigpOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ2RlcHRoVGV4dHVyZScsIGJsdXJyZWRSZW5kZXJUYXJnZXQsIHNhbXBsZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgYWRkaXRpb25hbE1hdGVyaWFscykge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcignZGVwdGhUZXh0dXJlJywgYmx1cnJlZFJlbmRlclRhcmdldCwgc2FtcGxlcik7XG4gICAgfVxuICAgIHRoaXMuX19kaXJlY3Rpb25hbFNoYWRvd01hcCA9IHsgdGV4dHVyZTogYmx1cnJlZFJlbmRlclRhcmdldCwgc2FtcGxlciB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGJsdXJyZWQgcGFyYWJvbG9pZCBzaGFkb3cgbWFwIHRleHR1cmUgZm9yIHBvaW50IGxpZ2h0cyBvbiBhbGwgZW50aXR5IG1hdGVyaWFscy5cbiAgICogQ3JlYXRlcyBhIGxpbmVhciBzYW1wbGVyIGFuZCBhc3NpZ25zIHRoZSBzaGFkb3cgbWFwIHRleHR1cmUgdG8gdGhlICdwYXJhYm9sb2lkRGVwdGhUZXh0dXJlJyBwYXJhbWV0ZXIuXG4gICAqIEFsc28gc2V0cyB0aGUgVVYgc2NhbGUgcGFyYW1ldGVyIGZvciBwb2ludCBsaWdodCBzaGFkb3cgbWFwcGluZy5cbiAgICogQHBhcmFtIGJsdXJyZWRSZW5kZXJUYXJnZXQgLSBUaGUgYmx1cnJlZCBwYXJhYm9sb2lkIHNoYWRvdyBtYXAgcmVuZGVyIHRhcmdldCB0ZXh0dXJlXG4gICAqIEBwYXJhbSBlbnRpdGllcyAtIEFycmF5IG9mIHNjZW5lIGdyYXBoIGVudGl0aWVzIHRvIGFwcGx5IHRoZSBzaGFkb3cgbWFwIHRvXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fc2V0UGFyYWJvbG9pZEJsdXJyZWRTaGFkb3dNYXAoXG4gICAgYmx1cnJlZFJlbmRlclRhcmdldDogUmVuZGVyVGFyZ2V0VGV4dHVyZSxcbiAgICBlbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSxcbiAgICBhZGRpdGlvbmFsTWF0ZXJpYWxzOiByZWFkb25seSBNYXRlcmlhbFtdID0gW11cbiAgKSB7XG4gICAgY29uc3Qgc2FtcGxlciA9IG5ldyBTYW1wbGVyKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgIG1pbkZpbHRlcjogVGV4dHVyZVBhcmFtZXRlci5MaW5lYXIsXG4gICAgICBtYWdGaWx0ZXI6IFRleHR1cmVQYXJhbWV0ZXIuTGluZWFyLFxuICAgICAgd3JhcFM6IFRleHR1cmVQYXJhbWV0ZXIuQ2xhbXBUb0VkZ2UsXG4gICAgICB3cmFwVDogVGV4dHVyZVBhcmFtZXRlci5DbGFtcFRvRWRnZSxcbiAgICB9KTtcbiAgICBzYW1wbGVyLmNyZWF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRNZXNoKCk7XG4gICAgICBpZiAobWVzaENvbXBvbmVudCAhPSBudWxsICYmIG1lc2hDb21wb25lbnQubWVzaCAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzaENvbXBvbmVudC5tZXNoLmdldFByaW1pdGl2ZU51bWJlcigpOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBwcmltaXRpdmUgPSBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlQXQoaSk7XG4gICAgICAgICAgcHJpbWl0aXZlLm1hdGVyaWFsLnNldFRleHR1cmVQYXJhbWV0ZXIoJ3BhcmFib2xvaWREZXB0aFRleHR1cmUnLCBibHVycmVkUmVuZGVyVGFyZ2V0LCBzYW1wbGVyKTtcbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwb2ludExpZ2h0U2hhZG93TWFwVXZTY2FsZScsIDAuOTMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgYWRkaXRpb25hbE1hdGVyaWFscykge1xuICAgICAgbWF0ZXJpYWwuc2V0VGV4dHVyZVBhcmFtZXRlcigncGFyYWJvbG9pZERlcHRoVGV4dHVyZScsIGJsdXJyZWRSZW5kZXJUYXJnZXQsIHNhbXBsZXIpO1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwb2ludExpZ2h0U2hhZG93TWFwVXZTY2FsZScsIDAuOTMpO1xuICAgIH1cbiAgICB0aGlzLl9fcGFyYWJvbG9pZFNoYWRvd01hcCA9IHsgdGV4dHVyZTogYmx1cnJlZFJlbmRlclRhcmdldCwgc2FtcGxlciB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlcHRoIHRleHR1cmUgaW5kZXggbGlzdCBwYXJhbWV0ZXIgb24gYWxsIGVudGl0eSBtYXRlcmlhbHMuXG4gICAqIFRoaXMgcGFyYW1ldGVyIG1hcHMgZWFjaCBsaWdodCB0byBpdHMgY29ycmVzcG9uZGluZyBzaGFkb3cgbWFwIHRleHR1cmUgaW5kZXguXG4gICAqIEBwYXJhbSBlbnRpdGllcyAtIEFycmF5IG9mIHNjZW5lIGdyYXBoIGVudGl0aWVzIHRvIGFwcGx5IHRoZSBpbmRleCBsaXN0IHRvXG4gICAqIEBwYXJhbSBkZXB0aFRleHR1cmVJbmRleExpc3QgLSBBcnJheSBvZiBpbmRpY2VzIG1hcHBpbmcgbGlnaHRzIHRvIHNoYWRvdyBtYXAgdGV4dHVyZXMgKC0xIGZvciBubyBzaGFkb3cpXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fc2V0RGVwdGhUZXh0dXJlSW5kZXhMaXN0KFxuICAgIGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLFxuICAgIGRlcHRoVGV4dHVyZUluZGV4TGlzdDogbnVtYmVyW10sXG4gICAgYWRkaXRpb25hbE1hdGVyaWFsczogcmVhZG9ubHkgTWF0ZXJpYWxbXSA9IFtdXG4gICkge1xuICAgIC8vIHNldFBhcmFtZXRlcigpIGNvcGllcyB0aGUgdmFsdWVzIGludG8gZWFjaCBtYXRlcmlhbCwgc28gb25lIFZlY3Rvck4gY2FuIGJlIHNoYXJlZC5cbiAgICBjb25zdCBpbmRleExpc3QgPSBuZXcgVmVjdG9yTihuZXcgSW50MzJBcnJheShkZXB0aFRleHR1cmVJbmRleExpc3QpKTtcbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBlbnRpdGllcykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChtZXNoQ29tcG9uZW50ICE9IG51bGwgJiYgbWVzaENvbXBvbmVudC5tZXNoICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2hDb21wb25lbnQubWVzaC5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkZXB0aFRleHR1cmVJbmRleExpc3QnLCBpbmRleExpc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgYWRkaXRpb25hbE1hdGVyaWFscykge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkZXB0aFRleHR1cmVJbmRleExpc3QnLCBpbmRleExpc3QpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmYXIgcGxhbmUgdXNlZCB0byBub3JtYWxpemUgdGhlIHBhcmFib2xvaWQgc2hhZG93IG1hcCBvZiBhIHBvaW50IGxpZ2h0LlxuICAgKlxuICAgKiBUaGUgcHJpb3JpdHkgaXMgdGhlIGV4cGxpY2l0IGBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmVgLCB0aGUgZWZmZWN0aXZlIHJhbmdlIG9mIHRoZVxuICAgKiBsaWdodCwgaXRzIGF1dG9tYXRpYyByYW5nZSwgYW5kIGZpbmFsbHkgdGhlIGZhcnRoZXN0IHNoYWRvdyByZWNlaXZlciBpbiB0aGUgc2NlbmUuXG4gICAqIEEgZmluaXRlIGZhciBwbGFuZSBrZWVwcyB0aGUgY2xlYXJlZCBiYWNrZ3JvdW5kIGRlcHRoIGNsb3NlIHRvIHRoZSBjYXN0ZXJzOyB3aXRoIHRoZVxuICAgKiBsZWdhY3kgdW5saW1pdGVkIGZhciBwbGFuZSBvZiAxMDAwIHRoZSBHYXVzc2lhbiBibHVyIG1peGVzIHRoZSBmYXIgYmFja2dyb3VuZCBpbnRvIHRoZVxuICAgKiBtb21lbnRzIGFuZCB0aGUgc2hhZG93cyBvZiBzY2VuZXMgbXVjaCBzbWFsbGVyIHRoYW4gMTAwMCB1bml0cyBkaXNhcHBlYXIuXG4gICAqXG4gICAqIEBwYXJhbSBsaWdodENvbXBvbmVudCAtIFRoZSBwb2ludCBsaWdodCBjb21wb25lbnRcbiAgICogQHBhcmFtIGVudGl0aWVzIC0gVGhlIGVudGl0aWVzIGluIHRoZSBzY2VuZSAodXNlZCBmb3IgdGhlIGF1dG9tYXRpYyBmYXIgcGxhbmUpXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0UG9pbnRMaWdodEZhclBsYW5lKGxpZ2h0Q29tcG9uZW50OiBMaWdodENvbXBvbmVudCwgZW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pIHtcbiAgICBjb25zdCBleHBsaWNpdEZhclBsYW5lID0gbGlnaHRDb21wb25lbnQucG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lO1xuICAgIGlmIChleHBsaWNpdEZhclBsYW5lID4gMCkge1xuICAgICAgcmV0dXJuIGV4cGxpY2l0RmFyUGxhbmU7XG4gICAgfVxuICAgIGlmIChsaWdodENvbXBvbmVudC5yYW5nZSA+IDApIHtcbiAgICAgIHJldHVybiBsaWdodENvbXBvbmVudC5yYW5nZTtcbiAgICB9XG4gICAgLy8gVGhlIGVmZmVjdGl2ZSByYW5nZSBpbmNsdWRlcyB0aGUgYXV0b21hdGljIHJhbmdlIChDb25maWcubGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGQpIGFuZFxuICAgIC8vIENvbmZpZy5saWdodFJhbmdlU2NhbGUuIFRoYXQgcmFuZ2UgaXMgYSBsaWdodC1jdWxsaW5nL3NoYWRpbmcgYm91bmQsIG5vdCBhIHNjZW5lIGJvdW5kOiB3aXRoXG4gICAgLy8gdGhlIGVkaXRvcidzIHRocmVzaG9sZCBvZiAwLjAxIGFuIGludGVuc2l0eS0yMCBsaWdodCBnZXRzIGEgcmFuZ2Ugb2YgNDQuNyBldmVuIGluIGEgc2NlbmVcbiAgICAvLyBvbmx5IGEgZmV3IHVuaXRzIGxhcmdlLiBGaXQgdGhlIGZhciBwbGFuZSB0byB0aGUgcmVjZWl2ZXJzIGluc3RlYWQgYW5kIHVzZSB0aGUgZWZmZWN0aXZlXG4gICAgLy8gcmFuZ2Ugb25seSBhcyBhbiB1cHBlciBib3VuZCAocmVjZWl2ZXJzIGJleW9uZCBpdCBhcmUgdW5saXQgYW55d2F5KS5cbiAgICBjb25zdCBzY2VuZUZhclBsYW5lID0gdGhpcy5fX2dldFNjZW5lRmFyUGxhbmVGb3JQb2ludExpZ2h0KGxpZ2h0Q29tcG9uZW50LCBlbnRpdGllcyk7XG4gICAgY29uc3QgZWZmZWN0aXZlUmFuZ2UgPSBsaWdodENvbXBvbmVudC5fbGlnaHRQcm9wZXJ0eUZvckdwdS5fdlsxXTtcbiAgICBpZiAoZWZmZWN0aXZlUmFuZ2UgPiAwKSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4oc2NlbmVGYXJQbGFuZSwgZWZmZWN0aXZlUmFuZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gc2NlbmVGYXJQbGFuZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZmFyIHBsYW5lIHRoYXQgY292ZXJzIGV2ZXJ5IHNoYWRvdyByZWNlaXZlciBvZiBhbiB1bmxpbWl0ZWQgcG9pbnQgbGlnaHQuXG4gICAqXG4gICAqIFRoZSBmYXJ0aGVzdCBjb3JuZXIgb2YgdGhlIG1lcmdlZCBBQUJCcyBpcyB1c2VkIHNvIHRoYXQgcmVjZWl2ZXJzIGF0IHRoZSBmYXIgc2lkZSBvZlxuICAgKiBhbiBvYmplY3QgYXJlIHN0aWxsIGluc2lkZSB0aGUgc2hhZG93IG1hcC4gQmFja2dyb3VuZCBhc3NldHMgYW5kIGxpZ2h0IGdpem1vcyBhcmVcbiAgICogaWdub3JlZC4gV2hlbiB0aGUgc2NlbmUgaGFzIG5vIHJlY2VpdmVyLCB0aGUgbGVnYWN5IHZhbHVlIGlzIGtlcHQuXG4gICAqXG4gICAqIEBwYXJhbSBsaWdodENvbXBvbmVudCAtIFRoZSBwb2ludCBsaWdodCBjb21wb25lbnRcbiAgICogQHBhcmFtIGVudGl0aWVzIC0gVGhlIGVudGl0aWVzIGluIHRoZSBzY2VuZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFNjZW5lRmFyUGxhbmVGb3JQb2ludExpZ2h0KGxpZ2h0Q29tcG9uZW50OiBMaWdodENvbXBvbmVudCwgZW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10pOiBudW1iZXIge1xuICAgIGNvbnN0IGxpZ2h0UG9zaXRpb25BcnJheSA9IGxpZ2h0Q29tcG9uZW50Ll9saWdodFBvc2l0aW9uRm9yR3B1Ll92O1xuICAgIGNvbnN0IGxpZ2h0UG9zaXRpb24gPSB7XG4gICAgICB4OiBsaWdodFBvc2l0aW9uQXJyYXlbMF0sXG4gICAgICB5OiBsaWdodFBvc2l0aW9uQXJyYXlbMV0sXG4gICAgICB6OiBsaWdodFBvc2l0aW9uQXJyYXlbMl0sXG4gICAgfTtcbiAgICBsZXQgZmFydGhlc3REaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgIGNvbnN0IHJlY2VpdmVycyA9IGVudGl0aWVzLmZpbHRlcihcbiAgICAgIGVudGl0eSA9PiBTaGFkb3dTeXN0ZW0uX19pc1NoYWRvd0Nhc3RlcihlbnRpdHkpICYmICFTaGFkb3dTeXN0ZW0uX19pc0xpZ2h0RW50aXR5KGVudGl0eSlcbiAgICApO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHJlY2VpdmVycykge1xuICAgICAgY29uc3Qgc2NlbmVHcmFwaCA9IGVudGl0eS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgICBpZiAoIXNjZW5lR3JhcGguaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYWFiYiA9IHNjZW5lR3JhcGgud29ybGRNZXJnZWRBQUJCO1xuICAgICAgaWYgKGFhYmIgIT0gbnVsbCAmJiAhYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgICBjb25zdCBtaW4gPSBhYWJiLm1pblBvaW50O1xuICAgICAgICBjb25zdCBtYXggPSBhYWJiLm1heFBvaW50O1xuICAgICAgICBjb25zdCBkeCA9IE1hdGgubWF4KE1hdGguYWJzKGxpZ2h0UG9zaXRpb24ueCAtIG1pbi54KSwgTWF0aC5hYnMobGlnaHRQb3NpdGlvbi54IC0gbWF4LngpKTtcbiAgICAgICAgY29uc3QgZHkgPSBNYXRoLm1heChNYXRoLmFicyhsaWdodFBvc2l0aW9uLnkgLSBtaW4ueSksIE1hdGguYWJzKGxpZ2h0UG9zaXRpb24ueSAtIG1heC55KSk7XG4gICAgICAgIGNvbnN0IGR6ID0gTWF0aC5tYXgoTWF0aC5hYnMobGlnaHRQb3NpdGlvbi56IC0gbWluLnopLCBNYXRoLmFicyhsaWdodFBvc2l0aW9uLnogLSBtYXgueikpO1xuICAgICAgICBmYXJ0aGVzdERpc3RhbmNlU3F1YXJlZCA9IE1hdGgubWF4KGZhcnRoZXN0RGlzdGFuY2VTcXVhcmVkLCBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBzY2VuZUdyYXBoLndvcmxkUG9zaXRpb247XG4gICAgICAgIGNvbnN0IGR4ID0gcG9zaXRpb24ueCAtIGxpZ2h0UG9zaXRpb24ueDtcbiAgICAgICAgY29uc3QgZHkgPSBwb3NpdGlvbi55IC0gbGlnaHRQb3NpdGlvbi55O1xuICAgICAgICBjb25zdCBkeiA9IHBvc2l0aW9uLnogLSBsaWdodFBvc2l0aW9uLno7XG4gICAgICAgIGZhcnRoZXN0RGlzdGFuY2VTcXVhcmVkID0gTWF0aC5tYXgoZmFydGhlc3REaXN0YW5jZVNxdWFyZWQsIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmF5bWFyY2hpbmcgcmVjZWl2ZXJzIGFyZSBub3QgaW4gdGhlIHJlbmRlciBleHByZXNzaW9ucycgZW50aXR5IGxpc3QuXG4gICAgY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShcbiAgICAgIFJheW1hcmNoaW5nQ29tcG9uZW50XG4gICAgKSBhcyBSYXltYXJjaGluZ0NvbXBvbmVudFtdO1xuICAgIGZvciAoY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnQgb2YgcmF5bWFyY2hpbmdDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCByYXltYXJjaGluZ1NjZW5lR3JhcGggPSByYXltYXJjaGluZ0NvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgICBpZiAocmF5bWFyY2hpbmdTY2VuZUdyYXBoID09IG51bGwgfHwgIXJheW1hcmNoaW5nU2NlbmVHcmFwaC5pc1Zpc2libGUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBhYWJiID0gcmF5bWFyY2hpbmdDb21wb25lbnQuY2FsY1dvcmxkQUFCQigpO1xuICAgICAgaWYgKGFhYmIgPT0gbnVsbCB8fCBhYWJiLmlzVmFuaWxsYSgpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgbWluID0gYWFiYi5taW5Qb2ludDtcbiAgICAgIGNvbnN0IG1heCA9IGFhYmIubWF4UG9pbnQ7XG4gICAgICBjb25zdCBkeCA9IE1hdGgubWF4KE1hdGguYWJzKGxpZ2h0UG9zaXRpb24ueCAtIG1pbi54KSwgTWF0aC5hYnMobGlnaHRQb3NpdGlvbi54IC0gbWF4LngpKTtcbiAgICAgIGNvbnN0IGR5ID0gTWF0aC5tYXgoTWF0aC5hYnMobGlnaHRQb3NpdGlvbi55IC0gbWluLnkpLCBNYXRoLmFicyhsaWdodFBvc2l0aW9uLnkgLSBtYXgueSkpO1xuICAgICAgY29uc3QgZHogPSBNYXRoLm1heChNYXRoLmFicyhsaWdodFBvc2l0aW9uLnogLSBtaW4ueiksIE1hdGguYWJzKGxpZ2h0UG9zaXRpb24ueiAtIG1heC56KSk7XG4gICAgICBmYXJ0aGVzdERpc3RhbmNlU3F1YXJlZCA9IE1hdGgubWF4KGZhcnRoZXN0RGlzdGFuY2VTcXVhcmVkLCBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xuICAgIH1cblxuICAgIGlmIChmYXJ0aGVzdERpc3RhbmNlU3F1YXJlZCA8PSAwKSB7XG4gICAgICByZXR1cm4gMTAwMDtcbiAgICB9XG4gICAgLy8gQSBzbWFsbCBtYXJnaW4ga2VlcHMgdGhlIGZhcnRoZXN0IHJlY2VpdmVyIGluc2lkZSB0aGUgc2hhZG93IG1hcC5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KGZhcnRoZXN0RGlzdGFuY2VTcXVhcmVkKSAqIDEuMDUgKyAwLjE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgcGVyLXNsb3QgZmFyIHBsYW5lcyBvZiB0aGUgcG9pbnQgbGlnaHQgc2hhZG93IG1hcHMgd2hlbiB0aGV5IGNoYW5nZS5cbiAgICogQ2FsbGluZyB0aGlzIGV2ZXJ5IGZyYW1lIGtlZXBzIHRoZSBhdXRvbWF0aWMgZmFyIHBsYW5lIGluIHN5bmMgd2l0aCBtb3ZpbmcgbGlnaHRzLFxuICAgKiBjYXN0ZXJzIGFuZCByZWNlaXZlcnMgd2l0aG91dCByZWJ1aWxkaW5nIHRoZSBzaGFkb3cgZXhwcmVzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBlbnRpdGllcyAtIFRoZSBlbnRpdGllcyBpbiB0aGUgc2NlbmVcbiAgICogQHBhcmFtIGFkZGl0aW9uYWxNYXRlcmlhbHMgLSBNYXRlcmlhbHMgdGhhdCBhcmUgbm90IHJlYWNoZWQgdGhyb3VnaCB0aGUgZW50aXRpZXNcbiAgICogICAoZm9yIGV4YW1wbGUgdGhlIHJheW1hcmNoaW5nIG1hdGVyaWFsKVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZVBvaW50TGlnaHRGYXJQbGFuZXMoZW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sIGFkZGl0aW9uYWxNYXRlcmlhbHM6IHJlYWRvbmx5IE1hdGVyaWFsW10gPSBbXSkge1xuICAgIGlmICh0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlciA8PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50cyA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoTGlnaHRDb21wb25lbnQpIGFzIExpZ2h0Q29tcG9uZW50W107XG4gICAgY29uc3QgcG9pbnRMaWdodHMgPSBsaWdodENvbXBvbmVudHMuZmlsdGVyKFxuICAgICAgbGlnaHRDb21wb25lbnQgPT5cbiAgICAgICAgbGlnaHRDb21wb25lbnQudHlwZSA9PT0gTGlnaHRUeXBlLlBvaW50ICYmXG4gICAgICAgIGxpZ2h0Q29tcG9uZW50LmVuYWJsZSAmJlxuICAgICAgICBsaWdodENvbXBvbmVudC5jYXN0U2hhZG93ICYmXG4gICAgICAgIGxpZ2h0Q29tcG9uZW50Ll9zaGFkb3dTbG90ID49IDBcbiAgICApO1xuICAgIGlmIChwb2ludExpZ2h0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBtYXhMaWdodE51bWJlciA9IHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyO1xuICAgIGNvbnN0IG5ld0xpc3Q6IG51bWJlcltdID0gbmV3IEFycmF5KG1heExpZ2h0TnVtYmVyKS5maWxsKDEwMDApO1xuICAgIGZvciAoY29uc3QgbGlnaHRDb21wb25lbnQgb2YgcG9pbnRMaWdodHMpIHtcbiAgICAgIG5ld0xpc3RbbGlnaHRDb21wb25lbnQuX3NoYWRvd1Nsb3RdID0gdGhpcy5fX2dldFBvaW50TGlnaHRGYXJQbGFuZShsaWdodENvbXBvbmVudCwgZW50aXRpZXMpO1xuICAgIH1cblxuICAgIGxldCBjaGFuZ2VkID0gdGhpcy5fX3BvaW50TGlnaHRGYXJQbGFuZUxpc3QubGVuZ3RoICE9PSBtYXhMaWdodE51bWJlcjtcbiAgICBpZiAoIWNoYW5nZWQpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4TGlnaHROdW1iZXI7IGkrKykge1xuICAgICAgICBpZiAoTWF0aC5hYnMobmV3TGlzdFtpXSAtIHRoaXMuX19wb2ludExpZ2h0RmFyUGxhbmVMaXN0W2ldKSA+IDFlLTQpIHtcbiAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWNoYW5nZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGxpZ2h0Q29tcG9uZW50IG9mIHBvaW50TGlnaHRzKSB7XG4gICAgICBjb25zdCBzaGFkb3dTbG90ID0gbGlnaHRDb21wb25lbnQuX3NoYWRvd1Nsb3Q7XG4gICAgICB0aGlzLl9fcG9pbnRTaGFkb3dNYXAuc2V0RmFyUGxhbmUoc2hhZG93U2xvdCwgbmV3TGlzdFtzaGFkb3dTbG90XSk7XG4gICAgICAvLyBUaGUgU0RGIGNhc3RlciBtYXRlcmlhbHMgaG9sZCB0aGUgZmFyIHBsYW5lIHBlciBzbG90IGFzIGEgbWF0ZXJpYWwgcGFyYW1ldGVyLlxuICAgICAgdGhpcy5fX3JheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyPy51cGRhdGVQb2ludExpZ2h0RmFyUGxhbmU/LihzaGFkb3dTbG90LCBuZXdMaXN0W3NoYWRvd1Nsb3RdKTtcbiAgICB9XG4gICAgdGhpcy5fX3BvaW50TGlnaHRGYXJQbGFuZUxpc3QgPSBuZXdMaXN0O1xuICAgIHRoaXMuX19zZXRQb2ludExpZ2h0RmFyUGxhbmVMaXN0KGVudGl0aWVzLCBuZXdMaXN0LCBhZGRpdGlvbmFsTWF0ZXJpYWxzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwZXItc2hhZG93LXNsb3QgZmFyIHBsYW5lcyBvZiB0aGUgcGFyYWJvbG9pZCBzaGFkb3cgbWFwcyBvbiBhbGwgZW50aXR5IG1hdGVyaWFscy5cbiAgICogQHBhcmFtIGVudGl0aWVzIC0gQXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXMgdG8gYXBwbHkgdGhlIGZhciBwbGFuZXMgdG9cbiAgICogQHBhcmFtIHBvaW50TGlnaHRGYXJQbGFuZUxpc3QgLSBGYXIgcGxhbmUgb2YgZWFjaCBzaGFkb3cgc2xvdCAoMTAwMCBmb3Igc2xvdHMgd2l0aG91dCBhIHBvaW50IGxpZ2h0KVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldFBvaW50TGlnaHRGYXJQbGFuZUxpc3QoXG4gICAgZW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10sXG4gICAgcG9pbnRMaWdodEZhclBsYW5lTGlzdDogbnVtYmVyW10sXG4gICAgYWRkaXRpb25hbE1hdGVyaWFsczogcmVhZG9ubHkgTWF0ZXJpYWxbXSA9IFtdXG4gICkge1xuICAgIC8vIHNldFBhcmFtZXRlcigpIGNvcGllcyB0aGUgdmFsdWVzIGludG8gZWFjaCBtYXRlcmlhbCwgc28gb25lIFZlY3Rvck4gY2FuIGJlIHNoYXJlZC5cbiAgICBjb25zdCBmYXJQbGFuZUxpc3QgPSBuZXcgVmVjdG9yTihuZXcgRmxvYXQzMkFycmF5KHBvaW50TGlnaHRGYXJQbGFuZUxpc3QpKTtcbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBlbnRpdGllcykge1xuICAgICAgY29uc3QgbWVzaENvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChtZXNoQ29tcG9uZW50ICE9IG51bGwgJiYgbWVzaENvbXBvbmVudC5tZXNoICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXNoQ29tcG9uZW50Lm1lc2guZ2V0UHJpbWl0aXZlTnVtYmVyKCk7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IG1lc2hDb21wb25lbnQubWVzaC5nZXRQcmltaXRpdmVBdChpKTtcbiAgICAgICAgICBwcmltaXRpdmUubWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwb2ludExpZ2h0RmFyUGxhbmUnLCBmYXJQbGFuZUxpc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgYWRkaXRpb25hbE1hdGVyaWFscykge1xuICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwb2ludExpZ2h0RmFyUGxhbmUnLCBmYXJQbGFuZUxpc3QpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaXRzIHRoZSB6TmVhciBvZiB0aGUgc3BvdCBsaWdodCBzaGFkb3cgY2FtZXJhcyB0byB0aGUgc2NlbmUuXG4gICAqXG4gICAqIEEgcGVyc3BlY3RpdmUgc2hhZG93IG1hcCBzcGVuZHMgbW9zdCBvZiBpdHMgZGVwdGggcmFuZ2UgbmVhciB0aGUgZmFyIHBsYW5lLCB3aGljaCBtYWtlc1xuICAgKiB2YXJpYW5jZSBzaGFkb3cgbWFwcyBzaGFsbG93LiBTZXR0aW5nIHpOZWFyIGJlbG93IHRoZSBuZWFyZXN0IGNhc3RlciBtYWtlcyB0aGUgZGVwdGhcbiAgICogZGlzdHJpYnV0aW9uIG1vcmUgbGluZWFyLiBUaGUgdmFsdWUgaXMgbGltaXRlZCB0byA1JSBvZiB0aGUgbGlnaHQgcmFuZ2UgYW5kIHRvIDEuMCBzb1xuICAgKiB0aGF0IGl0IHN0YXlzIGNvbnNlcnZhdGl2ZS5cbiAgICpcbiAgICogQHBhcmFtIGVudGl0aWVzIC0gVGhlIGVudGl0aWVzIGluIHRoZSBzY2VuZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZVNwb3RMaWdodFNoYWRvd1pOZWFyKGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShMaWdodENvbXBvbmVudCkgYXMgTGlnaHRDb21wb25lbnRbXTtcbiAgICBjb25zdCBzcG90TGlnaHRzID0gbGlnaHRDb21wb25lbnRzLmZpbHRlcihcbiAgICAgIGxpZ2h0Q29tcG9uZW50ID0+IGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5TcG90ICYmIGxpZ2h0Q29tcG9uZW50LmVuYWJsZSAmJiBsaWdodENvbXBvbmVudC5jYXN0U2hhZG93XG4gICAgKTtcbiAgICBpZiAoc3BvdExpZ2h0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFkb3dDYXN0ZXJzID0gZW50aXRpZXMuZmlsdGVyKFxuICAgICAgZW50aXR5ID0+IFNoYWRvd1N5c3RlbS5fX2lzU2hhZG93Q2FzdGVyKGVudGl0eSkgJiYgIVNoYWRvd1N5c3RlbS5fX2lzTGlnaHRFbnRpdHkoZW50aXR5KVxuICAgICk7XG5cbiAgICBmb3IgKGNvbnN0IGxpZ2h0Q29tcG9uZW50IG9mIHNwb3RMaWdodHMpIHtcbiAgICAgIGNvbnN0IGxpZ2h0UG9zaXRpb25BcnJheSA9IGxpZ2h0Q29tcG9uZW50Ll9saWdodFBvc2l0aW9uRm9yR3B1Ll92O1xuICAgICAgY29uc3QgbGlnaHRQb3NpdGlvbiA9IHtcbiAgICAgICAgeDogbGlnaHRQb3NpdGlvbkFycmF5WzBdLFxuICAgICAgICB5OiBsaWdodFBvc2l0aW9uQXJyYXlbMV0sXG4gICAgICAgIHo6IGxpZ2h0UG9zaXRpb25BcnJheVsyXSxcbiAgICAgIH07XG4gICAgICBsZXQgbmVhcmVzdERpc3RhbmNlU3F1YXJlZCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBzaGFkb3dDYXN0ZXJzKSB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgICBjb25zdCBhYWJiID0gc2NlbmVHcmFwaC53b3JsZE1lcmdlZEFBQkI7XG4gICAgICAgIGxldCBkaXN0YW5jZVNxdWFyZWQ6IG51bWJlcjtcbiAgICAgICAgaWYgKGFhYmIgIT0gbnVsbCAmJiAhYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgICAgIGNvbnN0IG1pbiA9IGFhYmIubWluUG9pbnQ7XG4gICAgICAgICAgY29uc3QgbWF4ID0gYWFiYi5tYXhQb2ludDtcbiAgICAgICAgICAvLyBBIGNhc3RlciB0aGF0IGVuY2xvc2VzIHRoZSBsaWdodCAoZm9yIGV4YW1wbGUgYSBiYWNrZ3JvdW5kIHNwaGVyZSkgZG9lcyBub3QgYm91bmRcbiAgICAgICAgICAvLyB6TmVhcjogaXRzIHN1cmZhY2UgY2FuIGJlIGZhciBmcm9tIHRoZSBsaWdodCBldmVuIHdoZW4gaXRzIEFBQkIgY29udGFpbnMgaXQuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWluLnggPD0gbGlnaHRQb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBsaWdodFBvc2l0aW9uLnggPD0gbWF4LnggJiZcbiAgICAgICAgICAgIG1pbi55IDw9IGxpZ2h0UG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgbGlnaHRQb3NpdGlvbi55IDw9IG1heC55ICYmXG4gICAgICAgICAgICBtaW4ueiA8PSBsaWdodFBvc2l0aW9uLnogJiZcbiAgICAgICAgICAgIGxpZ2h0UG9zaXRpb24ueiA8PSBtYXguelxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGR4ID1cbiAgICAgICAgICAgIGxpZ2h0UG9zaXRpb24ueCA8IG1pbi54ID8gbWluLnggLSBsaWdodFBvc2l0aW9uLnggOiBsaWdodFBvc2l0aW9uLnggPiBtYXgueCA/IGxpZ2h0UG9zaXRpb24ueCAtIG1heC54IDogMDtcbiAgICAgICAgICBjb25zdCBkeSA9XG4gICAgICAgICAgICBsaWdodFBvc2l0aW9uLnkgPCBtaW4ueSA/IG1pbi55IC0gbGlnaHRQb3NpdGlvbi55IDogbGlnaHRQb3NpdGlvbi55ID4gbWF4LnkgPyBsaWdodFBvc2l0aW9uLnkgLSBtYXgueSA6IDA7XG4gICAgICAgICAgY29uc3QgZHogPVxuICAgICAgICAgICAgbGlnaHRQb3NpdGlvbi56IDwgbWluLnogPyBtaW4ueiAtIGxpZ2h0UG9zaXRpb24ueiA6IGxpZ2h0UG9zaXRpb24ueiA+IG1heC56ID8gbGlnaHRQb3NpdGlvbi56IC0gbWF4LnogOiAwO1xuICAgICAgICAgIGRpc3RhbmNlU3F1YXJlZCA9IGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBQcm9jZWR1cmFsIG1lc2hlcyBjYW4gaGF2ZSBhIHZhbmlsbGEgbWVyZ2VkIEFBQkIuIFRoZWlyIHdvcmxkIHBvc2l0aW9uIGlzIHN0aWxsXG4gICAgICAgICAgLy8gYSB1c2VmdWwgY29uc2VydmF0aXZlIGJvdW5kOiB6TmVhciBzdGF5cyBhdCBoYWxmIHRoZSBkaXN0YW5jZSB0byB0aGUgY2VudGVyLlxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gc2NlbmVHcmFwaC53b3JsZFBvc2l0aW9uO1xuICAgICAgICAgIGNvbnN0IGR4ID0gcG9zaXRpb24ueCAtIGxpZ2h0UG9zaXRpb24ueDtcbiAgICAgICAgICBjb25zdCBkeSA9IHBvc2l0aW9uLnkgLSBsaWdodFBvc2l0aW9uLnk7XG4gICAgICAgICAgY29uc3QgZHogPSBwb3NpdGlvbi56IC0gbGlnaHRQb3NpdGlvbi56O1xuICAgICAgICAgIGRpc3RhbmNlU3F1YXJlZCA9IGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkejtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlzdGFuY2VTcXVhcmVkIDwgbmVhcmVzdERpc3RhbmNlU3F1YXJlZCkge1xuICAgICAgICAgIG5lYXJlc3REaXN0YW5jZVNxdWFyZWQgPSBkaXN0YW5jZVNxdWFyZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU0RGIGVudGl0aWVzIGFyZSBub3QgcGFydCBvZiB0aGUgbWVzaCBjYXN0ZXIgZW50aXRpZXMsIHNvIHRoZWlyIGJvdW5kcyBhcmUgYWRkZWRcbiAgICAgIC8vIGZvciB0aGUgc2FtZSBuZWFyZXN0LWRpc3RhbmNlIGVzdGltYXRlLiBSZWNlaXZlcnMgYXJlIGluY2x1ZGVkIGFzIHdlbGwgYmVjYXVzZVxuICAgICAgLy8gdGhleSBuZWVkIHRvIGxpZSBiZXlvbmQgdGhlIHNoYWRvdyBjYW1lcmEncyBuZWFyIHBsYW5lLlxuICAgICAgY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShcbiAgICAgICAgUmF5bWFyY2hpbmdDb21wb25lbnRcbiAgICAgICkgYXMgUmF5bWFyY2hpbmdDb21wb25lbnRbXTtcbiAgICAgIGZvciAoY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnQgb2YgcmF5bWFyY2hpbmdDb21wb25lbnRzKSB7XG4gICAgICAgIGNvbnN0IHNjZW5lR3JhcGggPSByYXltYXJjaGluZ0NvbXBvbmVudC5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk7XG4gICAgICAgIGlmIChzY2VuZUdyYXBoID09IG51bGwgfHwgIXNjZW5lR3JhcGguaXNWaXNpYmxlKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJheW1hcmNoaW5nQ29tcG9uZW50LmVudGl0eS5nZXRUYWdWYWx1ZSgndHlwZScpID09PSAnYmFja2dyb3VuZC1hc3NldHMnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWFiYiA9IHNjZW5lR3JhcGgud29ybGRNZXJnZWRBQUJCO1xuICAgICAgICAvLyBVbmJvdW5kZWQgU0RGcyAoU2RCYXIgLyBTZFR1YmUgLyBTZFJlcGVhdCkgaGF2ZSBhIHZhbmlsbGEgQUFCQjsgdGhleSBrZWVwIHRoZVxuICAgICAgICAvLyBjb25zZXJ2YXRpdmUgZGVmYXVsdCB6TmVhciBpbnN0ZWFkIG9mIGEgcG90ZW50aWFsbHkgd3JvbmcgYm91bmQuXG4gICAgICAgIGlmIChhYWJiLmlzVmFuaWxsYSgpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWluID0gYWFiYi5taW5Qb2ludDtcbiAgICAgICAgY29uc3QgbWF4ID0gYWFiYi5tYXhQb2ludDtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG1pbi54IDw9IGxpZ2h0UG9zaXRpb24ueCAmJlxuICAgICAgICAgIGxpZ2h0UG9zaXRpb24ueCA8PSBtYXgueCAmJlxuICAgICAgICAgIG1pbi55IDw9IGxpZ2h0UG9zaXRpb24ueSAmJlxuICAgICAgICAgIGxpZ2h0UG9zaXRpb24ueSA8PSBtYXgueSAmJlxuICAgICAgICAgIG1pbi56IDw9IGxpZ2h0UG9zaXRpb24ueiAmJlxuICAgICAgICAgIGxpZ2h0UG9zaXRpb24ueiA8PSBtYXguelxuICAgICAgICApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkeCA9XG4gICAgICAgICAgbGlnaHRQb3NpdGlvbi54IDwgbWluLnggPyBtaW4ueCAtIGxpZ2h0UG9zaXRpb24ueCA6IGxpZ2h0UG9zaXRpb24ueCA+IG1heC54ID8gbGlnaHRQb3NpdGlvbi54IC0gbWF4LnggOiAwO1xuICAgICAgICBjb25zdCBkeSA9XG4gICAgICAgICAgbGlnaHRQb3NpdGlvbi55IDwgbWluLnkgPyBtaW4ueSAtIGxpZ2h0UG9zaXRpb24ueSA6IGxpZ2h0UG9zaXRpb24ueSA+IG1heC55ID8gbGlnaHRQb3NpdGlvbi55IC0gbWF4LnkgOiAwO1xuICAgICAgICBjb25zdCBkeiA9XG4gICAgICAgICAgbGlnaHRQb3NpdGlvbi56IDwgbWluLnogPyBtaW4ueiAtIGxpZ2h0UG9zaXRpb24ueiA6IGxpZ2h0UG9zaXRpb24ueiA+IG1heC56ID8gbGlnaHRQb3NpdGlvbi56IC0gbWF4LnogOiAwO1xuICAgICAgICBjb25zdCBkaXN0YW5jZVNxdWFyZWQgPSBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG4gICAgICAgIGlmIChkaXN0YW5jZVNxdWFyZWQgPCBuZWFyZXN0RGlzdGFuY2VTcXVhcmVkKSB7XG4gICAgICAgICAgbmVhcmVzdERpc3RhbmNlU3F1YXJlZCA9IGRpc3RhbmNlU3F1YXJlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgek5lYXIgPSAwLjE7XG4gICAgICBpZiAobGlnaHRDb21wb25lbnQucmFuZ2UgPiAwICYmIE51bWJlci5pc0Zpbml0ZShuZWFyZXN0RGlzdGFuY2VTcXVhcmVkKSkge1xuICAgICAgICBjb25zdCByYW5nZUNhcCA9IE1hdGgubWluKGxpZ2h0Q29tcG9uZW50LnJhbmdlICogMC4wNSwgMS4wKTtcbiAgICAgICAgek5lYXIgPSBNYXRoLm1heCgwLjAxLCBNYXRoLm1pbihNYXRoLnNxcnQobmVhcmVzdERpc3RhbmNlU3F1YXJlZCkgKiAwLjUsIHJhbmdlQ2FwKSk7XG4gICAgICB9XG4gICAgICBsaWdodENvbXBvbmVudC5fc2V0U2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKHpOZWFyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2lzTGlnaHRFbnRpdHkoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBnZXRMaWdodCA9IChlbnRpdHkgYXMgdW5rbm93biBhcyB7IGdldExpZ2h0PzogKCkgPT4gdW5rbm93biB9KS5nZXRMaWdodDtcbiAgICAgIHJldHVybiB0eXBlb2YgZ2V0TGlnaHQgPT09ICdmdW5jdGlvbicgJiYgZ2V0TGlnaHQuY2FsbChlbnRpdHkpICE9IG51bGw7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRlcHRoIGJpYXMgcHJvamVjdGlvbi12aWV3IG1hdHJpY2VzIGZvciBzaGFkb3cgbWFwcGluZyBvbiBhbGwgUEJSIG1hdGVyaWFscy5cbiAgICogQ2FsY3VsYXRlcyBhbmQgYXBwbGllcyBiaWFzIG1hdHJpY2VzIGZvciBkaXJlY3Rpb25hbCBhbmQgc3BvdCBsaWdodHMgdG8gcmVkdWNlIHNoYWRvdyBhY25lLlxuICAgKiBAcGFyYW0gZW50aXRpZXMgLSBBcnJheSBvZiBzY2VuZSBncmFwaCBlbnRpdGllcyB0byBhcHBseSB0aGUgYmlhcyBtYXRyaWNlcyB0b1xuICAgKi9cbiAgcHVibGljIHNldERlcHRoQmlhc1BWKGVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdLCBhZGRpdGlvbmFsTWF0ZXJpYWxzOiByZWFkb25seSBNYXRlcmlhbFtdID0gW10pIHtcbiAgICAvLyBUaGUgbWF0ZXJpYWxzIGhhdmUgbm8gZGVwdGhCaWFzUFYgcGFyYW1ldGVyIHdoZW4gdGhlcmUgYXJlIG5vIHNoYWRvdyBzbG90cy5cbiAgICBpZiAodGhpcy5fX2VuZ2luZS5jb25maWcubWF4TGlnaHROdW1iZXIgPD0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEF1dG8tZml0IERpcmVjdGlvbmFsTGlnaHQgc2hhZG93IGNhbWVyYSB2b2x1bWUgdG8gY292ZXIgdGhlIHdob2xlIHNjZW5lLlxuICAgIC8vIE5vdGU6IFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgbGlnaHQ7IGl0IG9ubHkgYWRqdXN0cyBzaGFkb3dBcmVhU2l6ZUZvckRpcmVjdGlvbmFsTGlnaHQgYW5kIHJhbmdlLlxuICAgIHRoaXMuX19hdXRvRml0RGlyZWN0aW9uYWxMaWdodFNoYWRvd1ZvbHVtZShlbnRpdGllcyk7XG4gICAgdGhpcy5fX3VwZGF0ZVNwb3RMaWdodFNoYWRvd1pOZWFyKGVudGl0aWVzKTtcbiAgICB0aGlzLnVwZGF0ZVBvaW50TGlnaHRGYXJQbGFuZXMoZW50aXRpZXMsIGFkZGl0aW9uYWxNYXRlcmlhbHMpO1xuXG4gICAgLy8gVGhpcyBydW5zIGV2ZXJ5IGZyYW1lLCBzbyB0aGUgYXJyYXlzIGFuZCB0aGUgVmVjdG9yTiBhcmUgcmV1c2VkLiBzZXRQYXJhbWV0ZXIoKSBjb3BpZXMgdGhlXG4gICAgLy8gdmFsdWVzIGludG8gdGhlIG1hdGVyaWFsJ3Mgb3duIHZhcmlhYmxlLCBzbyBzaGFyaW5nIG9uZSBWZWN0b3JOIGJldHdlZW4gbWF0ZXJpYWxzIGlzIHNhZmUuXG4gICAgLy8gVGhlIG1hdHJpY2VzIGFyZSBjb21wdXRlZCBpbnRvIGEgc2NyYXRjaCBidWZmZXIgZmlyc3Qgc28gdGhhdCBhIGNoYW5nZSBjYW4gYmUgZGV0ZWN0ZWQuXG4gICAgY29uc3QgYXJyYXlMZW5ndGggPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlciAqIDE2O1xuICAgIGxldCBmbG9hdDMyQXJyYXkgPSB0aGlzLl9fZGVwdGhCaWFzUFZBcnJheTtcbiAgICBsZXQgZGVwdGhCaWFzUFYgPSB0aGlzLl9fZGVwdGhCaWFzUFY7XG4gICAgbGV0IHNjcmF0Y2ggPSB0aGlzLl9fZGVwdGhCaWFzUFZTY3JhdGNoO1xuICAgIGlmIChmbG9hdDMyQXJyYXkgPT0gbnVsbCB8fCBkZXB0aEJpYXNQViA9PSBudWxsIHx8IHNjcmF0Y2ggPT0gbnVsbCB8fCBmbG9hdDMyQXJyYXkubGVuZ3RoICE9PSBhcnJheUxlbmd0aCkge1xuICAgICAgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShhcnJheUxlbmd0aCk7XG4gICAgICBkZXB0aEJpYXNQViA9IG5ldyBWZWN0b3JOKGZsb2F0MzJBcnJheSk7XG4gICAgICBzY3JhdGNoID0gbmV3IEZsb2F0MzJBcnJheShhcnJheUxlbmd0aCk7XG4gICAgICB0aGlzLl9fZGVwdGhCaWFzUFZBcnJheSA9IGZsb2F0MzJBcnJheTtcbiAgICAgIHRoaXMuX19kZXB0aEJpYXNQViA9IGRlcHRoQmlhc1BWO1xuICAgICAgdGhpcy5fX2RlcHRoQmlhc1BWU2NyYXRjaCA9IHNjcmF0Y2g7XG4gICAgICB0aGlzLl9fZGVwdGhCaWFzUFZWZXJzaW9uKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjcmF0Y2guZmlsbCgwKTtcbiAgICB9XG5cbiAgICAvLyBJdGVyYXRlIHRoZSBpbnRlcm5hbCBjb21wb25lbnQgYXJyYXkgaW5zdGVhZCBvZiBnZXRDb21wb25lbnRzV2l0aFR5cGUoKSwgd2hpY2ggYWxsb2NhdGVzIGFcbiAgICAvLyBmaWx0ZXJlZCBjb3B5LiBUaGUgbWF0cml4IG9mIGEgbGlnaHQgaXMgc3RvcmVkIGF0IGl0cyBzaGFkb3cgc2xvdC5cbiAgICBjb25zdCBsaWdodENvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuX2dldENvbXBvbmVudHMoTGlnaHRDb21wb25lbnQpIGFzXG4gICAgICB8IChMaWdodENvbXBvbmVudCB8IHVuZGVmaW5lZClbXVxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGxpZ2h0Q29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgICBjb25zdCBtYXhMaWdodE51bWJlciA9IHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaWdodENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSBsaWdodENvbXBvbmVudHNbaV07XG4gICAgICAgIGlmIChsaWdodENvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2hhZG93U2xvdCA9IGxpZ2h0Q29tcG9uZW50Ll9zaGFkb3dTbG90O1xuICAgICAgICBpZiAoc2hhZG93U2xvdCA8IDAgfHwgc2hhZG93U2xvdCA+PSBtYXhMaWdodE51bWJlcikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuRGlyZWN0aW9uYWwgfHwgbGlnaHRDb21wb25lbnQudHlwZSA9PT0gTGlnaHRUeXBlLlNwb3QpIHtcbiAgICAgICAgICBjb25zdCBsaWdodEVudGl0eSA9IGxpZ2h0Q29tcG9uZW50LmVudGl0eSBhcyBJU2NlbmVHcmFwaEVudGl0eSAmIElMaWdodEVudGl0eU1ldGhvZHMgJiBJQ2FtZXJhRW50aXR5TWV0aG9kcztcbiAgICAgICAgICBjb25zdCBjYW1lcmFDb21wb25lbnQgPSBsaWdodEVudGl0eS50cnlUb0dldENhbWVyYSgpO1xuICAgICAgICAgIGlmIChjYW1lcmFDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgYmlhc1ZpZXdQcm9qZWN0aW9uTWF0cml4ID0gY2FtZXJhQ29tcG9uZW50LmJpYXNWaWV3UHJvamVjdGlvbk1hdHJpeDtcbiAgICAgICAgICAgIHNjcmF0Y2guc2V0KGJpYXNWaWV3UHJvamVjdGlvbk1hdHJpeC5fdiwgc2hhZG93U2xvdCAqIDE2KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzY3JhdGNoW2ldICE9PSBmbG9hdDMyQXJyYXlbaV0pIHtcbiAgICAgICAgZmxvYXQzMkFycmF5LnNldChzY3JhdGNoKTtcbiAgICAgICAgdGhpcy5fX2RlcHRoQmlhc1BWVmVyc2lvbisrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXcml0aW5nIHRoZSBwYXJhbWV0ZXIgY29zdHMgYSBjb21wYXJpc29uIG9mIG1heExpZ2h0TnVtYmVyICogMTYgZmxvYXRzIHBlciBtYXRlcmlhbCwgd2hpY2hcbiAgICAvLyBkb21pbmF0ZXMgdGhlIGZyYW1lIGluIHNjZW5lcyB3aXRoIHRob3VzYW5kcyBvZiBtYXRlcmlhbHMuIEVhY2ggbWF0ZXJpYWwgaXMgd3JpdHRlbiBvbmx5XG4gICAgLy8gd2hlbiB0aGUgbWF0cmljZXMgY2hhbmdlZCBvciB3aGVuIHRoZSBtYXRlcmlhbCBoYXMgbm90IHJlY2VpdmVkIHRoZSBjdXJyZW50IHZhbHVlcyB5ZXRcbiAgICAvLyAoZS5nLiBhIG5ld2x5IGNyZWF0ZWQgb3IgbmV3bHkgYXNzaWduZWQgbWF0ZXJpYWwpLlxuICAgIGNvbnN0IHZlcnNpb24gPSB0aGlzLl9fZGVwdGhCaWFzUFZWZXJzaW9uO1xuICAgIGNvbnN0IHZlcnNpb25PZk1hdGVyaWFscyA9IHRoaXMuX19kZXB0aEJpYXNQVlZlcnNpb25PZk1hdGVyaWFscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gZW50aXRpZXNbaV0udHJ5VG9HZXRNZXNoKCk7XG4gICAgICBjb25zdCBtZXNoID0gbWVzaENvbXBvbmVudD8ubWVzaDtcbiAgICAgIGlmIChtZXNoICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlTnVtYmVyID0gbWVzaC5nZXRQcmltaXRpdmVOdW1iZXIoKTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmltaXRpdmVOdW1iZXI7IGorKykge1xuICAgICAgICAgIGNvbnN0IG1hdGVyaWFsOiBNYXRlcmlhbCA9IG1lc2guZ2V0UHJpbWl0aXZlQXQoaikubWF0ZXJpYWw7XG4gICAgICAgICAgY29uc3QgbWF0ZXJpYWxVaWQgPSBtYXRlcmlhbC5tYXRlcmlhbFVJRDtcbiAgICAgICAgICBpZiAodmVyc2lvbk9mTWF0ZXJpYWxzW21hdGVyaWFsVWlkXSA9PT0gdmVyc2lvbikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGVwdGhCaWFzUFYnLCBkZXB0aEJpYXNQVik7XG4gICAgICAgICAgLy8gTWF0ZXJpYWxzIHdpdGhvdXQgdGhlIHBhcmFtZXRlciBhcmUgbGVmdCB1bm1hcmtlZDogbWF0ZXJpYWwgZmllbGRzIGFyZSBmaXhlZCBhdFxuICAgICAgICAgIC8vIGNyZWF0aW9uLCBzbyB0aGlzIG9ubHkgcmUtY2hlY2tzIGEgY2hlYXAgbWFwIGxvb2t1cCBmb3IgdGhlbS5cbiAgICAgICAgICBpZiAobWF0ZXJpYWwuX2FsbEZpZWxkc0luZm8uaGFzKCdkZXB0aEJpYXNQVicpKSB7XG4gICAgICAgICAgICB2ZXJzaW9uT2ZNYXRlcmlhbHNbbWF0ZXJpYWxVaWRdID0gdmVyc2lvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiBhZGRpdGlvbmFsTWF0ZXJpYWxzKSB7XG4gICAgICBjb25zdCBtYXRlcmlhbFVpZCA9IG1hdGVyaWFsLm1hdGVyaWFsVUlEO1xuICAgICAgaWYgKHZlcnNpb25PZk1hdGVyaWFsc1ttYXRlcmlhbFVpZF0gPT09IHZlcnNpb24pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBtYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RlcHRoQmlhc1BWJywgZGVwdGhCaWFzUFYpO1xuICAgICAgaWYgKG1hdGVyaWFsLl9hbGxGaWVsZHNJbmZvLmhhcygnZGVwdGhCaWFzUFYnKSkge1xuICAgICAgICB2ZXJzaW9uT2ZNYXRlcmlhbHNbbWF0ZXJpYWxVaWRdID0gdmVyc2lvbjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyB0aGUgbGFzdCBjb21wdXRlZCBzaGFkb3cgc3RhdGUgKHNoYWRvdyBtYXBzLCBpbmRleCBsaXN0IGFuZCBiaWFzIG1hdHJpY2VzKVxuICAgKiB0byBtYXRlcmlhbHMgdGhhdCBhcmUgYXNzaWduZWQgYWZ0ZXIgZ2V0RXhwcmVzc2lvbnMoKSByYW4sIGZvciBleGFtcGxlIHRoZVxuICAgKiByYXltYXJjaGluZyBtYXRlcmlhbCBvZiB0aGUgYnVmZmVyLWxlc3MgZnVsbC1zY3JlZW4gcGFzcy5cbiAgICovXG4gIHB1YmxpYyBhcHBseVNoYWRvd1BhcmFtZXRlcnNUb01hdGVyaWFscyhtYXRlcmlhbHM6IHJlYWRvbmx5IE1hdGVyaWFsW10pIHtcbiAgICBpZiAodGhpcy5fX2VuZ2luZS5jb25maWcubWF4TGlnaHROdW1iZXIgPD0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpbmRleExpc3QgPSBuZXcgVmVjdG9yTihcbiAgICAgIG5ldyBJbnQzMkFycmF5KFxuICAgICAgICB0aGlzLl9fZGVwdGhUZXh0dXJlSW5kZXhMaXN0Lmxlbmd0aCA+IDBcbiAgICAgICAgICA/IHRoaXMuX19kZXB0aFRleHR1cmVJbmRleExpc3RcbiAgICAgICAgICA6IG5ldyBBcnJheSh0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlcikuZmlsbCgtMSlcbiAgICAgIClcbiAgICApO1xuICAgIGNvbnN0IGZhclBsYW5lTGlzdCA9IG5ldyBWZWN0b3JOKFxuICAgICAgbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgdGhpcy5fX3BvaW50TGlnaHRGYXJQbGFuZUxpc3QubGVuZ3RoID4gMFxuICAgICAgICAgID8gdGhpcy5fX3BvaW50TGlnaHRGYXJQbGFuZUxpc3RcbiAgICAgICAgICA6IG5ldyBBcnJheSh0aGlzLl9fZW5naW5lLmNvbmZpZy5tYXhMaWdodE51bWJlcikuZmlsbCgxMDAwKVxuICAgICAgKVxuICAgICk7XG4gICAgZm9yIChjb25zdCBtYXRlcmlhbCBvZiBtYXRlcmlhbHMpIHtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGVwdGhUZXh0dXJlSW5kZXhMaXN0JywgaW5kZXhMaXN0KTtcbiAgICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcigncG9pbnRMaWdodEZhclBsYW5lJywgZmFyUGxhbmVMaXN0KTtcbiAgICAgIGlmICh0aGlzLl9fZGlyZWN0aW9uYWxTaGFkb3dNYXAgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAgICdkZXB0aFRleHR1cmUnLFxuICAgICAgICAgIHRoaXMuX19kaXJlY3Rpb25hbFNoYWRvd01hcC50ZXh0dXJlLFxuICAgICAgICAgIHRoaXMuX19kaXJlY3Rpb25hbFNoYWRvd01hcC5zYW1wbGVyXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX3BhcmFib2xvaWRTaGFkb3dNYXAgIT0gbnVsbCkge1xuICAgICAgICBtYXRlcmlhbC5zZXRUZXh0dXJlUGFyYW1ldGVyKFxuICAgICAgICAgICdwYXJhYm9sb2lkRGVwdGhUZXh0dXJlJyxcbiAgICAgICAgICB0aGlzLl9fcGFyYWJvbG9pZFNoYWRvd01hcC50ZXh0dXJlLFxuICAgICAgICAgIHRoaXMuX19wYXJhYm9sb2lkU2hhZG93TWFwLnNhbXBsZXJcbiAgICAgICAgKTtcbiAgICAgICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdwb2ludExpZ2h0U2hhZG93TWFwVXZTY2FsZScsIDAuOTMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBCYWNrZ3JvdW5kIGFzc2V0cyAodGFnZ2VkIGB0eXBlOiBiYWNrZ3JvdW5kLWFzc2V0c2AsIGUuZy4gdGhlIGVudmlyb25tZW50IGN1YmUgYW5kIHRoZSBncmlkXG4gICAqIGluIFJob2Rvbml0ZUVkaXRvcjIpIGRvIG5vdCBjYXN0IHNoYWRvd3MuIFRoZSBzaGFkb3cgdm9sdW1lIGF1dG8tZml0IGV4Y2x1ZGVzIHRoZW0gYXMgd2VsbC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9faXNTaGFkb3dDYXN0ZXIoZW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkge1xuICAgIHJldHVybiBlbnRpdHkuZ2V0VGFnVmFsdWUoJ3R5cGUnKSAhPT0gJ2JhY2tncm91bmQtYXNzZXRzJztcbiAgfVxuXG4gIHByaXZhdGUgX19hdXRvRml0RGlyZWN0aW9uYWxMaWdodFNoYWRvd1ZvbHVtZShlbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICAgIGNvbnN0IHRyYW5zZm9ybVVwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHJheW1hcmNoaW5nQ29tcG9uZW50Q291bnQgPSB0aGlzLl9fZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRDb3VudCgpO1xuICAgIGNvbnN0IHJheW1hcmNoaW5nQUFCQlZlcnNpb24gPSBSYXltYXJjaGluZ0NvbXBvbmVudC5nZXRBQUJCVmVyc2lvbih0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoXG4gICAgICB0cmFuc2Zvcm1VcGRhdGVDb3VudCA9PT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudEZvckF1dG9GaXQgJiZcbiAgICAgIGVudGl0aWVzLmxlbmd0aCA9PT0gdGhpcy5fX2xhc3RFbnRpdHlDb3VudEZvckF1dG9GaXQgJiZcbiAgICAgIHJheW1hcmNoaW5nQ29tcG9uZW50Q291bnQgPT09IHRoaXMuX19sYXN0UmF5bWFyY2hpbmdDb21wb25lbnRDb3VudEZvckF1dG9GaXQgJiZcbiAgICAgIHJheW1hcmNoaW5nQUFCQlZlcnNpb24gPT09IHRoaXMuX19sYXN0UmF5bWFyY2hpbmdBQUJCVmVyc2lvbkZvckF1dG9GaXRcbiAgICApIHtcbiAgICAgIC8vIFJldXNlIHRoZSBjYWNoZWQgYm91bmRzOyB0aGUgcGVyLWxpZ2h0IGZpdCBzdGlsbCBmb2xsb3dzIGxpZ2h0IHRyYW5zZm9ybXMuXG4gICAgICB0aGlzLl9fYXBwbHlBdXRvRml0VG9EaXJlY3Rpb25hbExpZ2h0cyh0aGlzLl9fbGFzdEF1dG9GaXRCb3VuZHMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgbm9uLW1lc2ggLyBpbnZpc2libGUgZW50aXRpZXMgdG8gYXZvaWQgZW52aXJvbm1lbnQvYmFja2dyb3VuZCBvYmplY3RzIGluZmxhdGluZyBib3VuZHMuXG4gICAgLy8gSWYgdGhlIGFwcGxpY2F0aW9uIHVzZXMgYSAnYmFja2dyb3VuZC1hc3NldHMnIHRhZyAoYXMgUmhvZG9uaXRlRWRpdG9yMiBkb2VzKSwgZXhjbHVkZSB0aGVtIGFzIHdlbGwuXG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IGVudGl0aWVzLmZpbHRlcihlbnRpdHkgPT4ge1xuICAgICAgY29uc3Qgc2cgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgICAgaWYgKCFzZy5pc1Zpc2libGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVzaCA9IGVudGl0eS50cnlUb0dldE1lc2goKTtcbiAgICAgIGlmIChtZXNoID09IG51bGwgfHwgbWVzaC5tZXNoID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiAoZW50aXR5IGFzIGFueSkubWF0Y2hUYWcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKChlbnRpdHkgYXMgYW55KS5tYXRjaFRhZygndHlwZScsICdiYWNrZ3JvdW5kLWFzc2V0cycpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhcmdldHMgPSBjYW5kaWRhdGVzLmxlbmd0aCA+IDAgPyBjYW5kaWRhdGVzIDogZW50aXRpZXM7XG5cbiAgICBjb25zdCBtZXJnZWQgPSBuZXcgQUFCQigpO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHRhcmdldHMpIHtcbiAgICAgIGNvbnN0IGFhYmIgPSBlbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICAgIG1lcmdlZC5tZXJnZUFBQkIoYWFiYik7XG4gICAgfVxuXG4gICAgLy8gU0RGIGVudGl0aWVzIGFyZSBub3QgbWVzaCBlbnRpdGllcywgc28gdGhlaXIgYm91bmRzIGFyZSBhZGRlZCBzZXBhcmF0ZWx5ICh0aGVcbiAgICAvLyBzY2VuZSBncmFwaCBBQUJCIGFscmVhZHkgY29udGFpbnMgdGhlIFNERiBib3VuZHMpLiBSZWNlaXZlcnMgYXJlIGluY2x1ZGVkIGFzIHdlbGw6XG4gICAgLy8gdGhleSBuZWVkIHRvIGxpZSBpbnNpZGUgdGhlIGxpZ2h0IGZydXN0dW0gZm9yIHRoZSBzaGFkb3cgbWFwIGxvb2t1cC5cbiAgICB0aGlzLl9fbWVyZ2VSYXltYXJjaGluZ1NoYWRvd0JvdW5kcyhtZXJnZWQpO1xuXG4gICAgaWYgKG1lcmdlZC5pc1ZhbmlsbGEoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtVXBkYXRlQ291bnRGb3JBdXRvRml0ID0gdHJhbnNmb3JtVXBkYXRlQ291bnQ7XG4gICAgdGhpcy5fX2xhc3RFbnRpdHlDb3VudEZvckF1dG9GaXQgPSBlbnRpdGllcy5sZW5ndGg7XG4gICAgdGhpcy5fX2xhc3RSYXltYXJjaGluZ0NvbXBvbmVudENvdW50Rm9yQXV0b0ZpdCA9IHJheW1hcmNoaW5nQ29tcG9uZW50Q291bnQ7XG4gICAgdGhpcy5fX2xhc3RSYXltYXJjaGluZ0FBQkJWZXJzaW9uRm9yQXV0b0ZpdCA9IHJheW1hcmNoaW5nQUFCQlZlcnNpb247XG4gICAgdGhpcy5fX2xhc3RBdXRvRml0Qm91bmRzLmNvcHlDb21wb25lbnRzKG1lcmdlZCk7XG5cbiAgICB0aGlzLl9fYXBwbHlBdXRvRml0VG9EaXJlY3Rpb25hbExpZ2h0cyh0aGlzLl9fbGFzdEF1dG9GaXRCb3VuZHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgZGlyZWN0aW9uYWwvc3BvdCBzaGFkb3cgdm9sdW1lIGZpdHRpbmcgY2FjaGUsIHNvIHRoZSBuZXh0IGZyYW1lIHJlY29tcHV0ZXNcbiAgICogdGhlIHZvbHVtZSAoaW5jbHVkaW5nIHRoZSBTREYgYm91bmRzKS5cbiAgICovXG4gIHB1YmxpYyBpbnZhbGlkYXRlU2hhZG93Vm9sdW1lRml0dGluZygpIHtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybVVwZGF0ZUNvdW50Rm9yQXV0b0ZpdCA9IC0xO1xuICAgIHRoaXMuX19sYXN0UmF5bWFyY2hpbmdBQUJCVmVyc2lvbkZvckF1dG9GaXQgPSAtMTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRSYXltYXJjaGluZ0NvbXBvbmVudENvdW50KCkge1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKFxuICAgICAgUmF5bWFyY2hpbmdDb21wb25lbnRcbiAgICApIGFzIFJheW1hcmNoaW5nQ29tcG9uZW50W107XG4gICAgcmV0dXJuIGNvbXBvbmVudHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlcyB0aGUgd29ybGQgQUFCQnMgb2YgdGhlIHZpc2libGUgcmF5bWFyY2hpbmcgY29tcG9uZW50cyBpbnRvIGBtZXJnZWRgLlxuICAgKiBUaGUgc2NlbmUgZ3JhcGggQUFCQiBvZiBhbiBTREYgZW50aXR5IGFscmVhZHkgY29udGFpbnMgdGhlIFNERiBib3VuZHMsIHNvIHRoZSBjYWNoZWRcbiAgICogbWVyZ2VkIEFBQkIgaXMgdXNlZCBpbnN0ZWFkIG9mIGV2YWx1YXRpbmcgdGhlIGdyYXBoIGFnYWluLlxuICAgKi9cbiAgcHJpdmF0ZSBfX21lcmdlUmF5bWFyY2hpbmdTaGFkb3dCb3VuZHMobWVyZ2VkOiBBQUJCKSB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRzV2l0aFR5cGUoXG4gICAgICBSYXltYXJjaGluZ0NvbXBvbmVudFxuICAgICkgYXMgUmF5bWFyY2hpbmdDb21wb25lbnRbXTtcbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBjb21wb25lbnRzKSB7XG4gICAgICBjb25zdCBzY2VuZUdyYXBoID0gY29tcG9uZW50LmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChzY2VuZUdyYXBoID09IG51bGwgfHwgIXNjZW5lR3JhcGguaXNWaXNpYmxlKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGNvbXBvbmVudC5lbnRpdHkuZ2V0VGFnVmFsdWUoJ3R5cGUnKSA9PT0gJ2JhY2tncm91bmQtYXNzZXRzJykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFhYmIgPSBzY2VuZUdyYXBoLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICAgIGlmICghYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgICBtZXJnZWQubWVyZ2VBQUJCKGFhYmIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGaXRzIGV2ZXJ5IGRpcmVjdGlvbmFsIGxpZ2h0J3Mgb3J0aG9ncmFwaGljIHNoYWRvdyBjYW1lcmEgdG8gYGJvdW5kc2AuXG4gICAqXG4gICAqIFRoZSBib3VuZHMgYXJlIHByb2plY3RlZCBpbnRvIHRoZSBsaWdodCdzIGxvY2FsIHNwYWNlLCBhbmQgdGhlIG9ydGhvIGV4dGVudHMgYW5kIHRoZVxuICAgKiBkZXB0aCByYW5nZSBhcmUgdGFrZW4gZnJvbSB0aGF0IEFBQkIgKG5vdCBmcm9tIHRoZSBsaWdodC10by1jZW50ZXIgZGlzdGFuY2UpLiBUaGlzXG4gICAqIGtlZXBzIHRoZSBzaGFkb3cgbWFwJ3Mgd29ybGQtcGVyLXRleGVsIHNtYWxsIGVub3VnaCBmb3IgdGhlIFZTTSBibHVyIG5vdCB0byB3YXNoIG91dFxuICAgKiB0aGUgY2FzdCBzaGFkb3dzLCB3aGlsZSBzdGlsbCBjb3ZlcmluZyBldmVyeSBjYXN0ZXIgYW5kIHJlY2VpdmVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2FwcGx5QXV0b0ZpdFRvRGlyZWN0aW9uYWxMaWdodHMoYm91bmRzOiBBQUJCKSB7XG4gICAgY29uc3QgYXJlYU1hcmdpbiA9IDEuMTU7XG4gICAgY29uc3QgbmVhckZhck1hcmdpbiA9IDEuMjU7XG5cbiAgICAvLyBDYWxsZWQgZXZlcnkgZnJhbWU6IGl0ZXJhdGUgdGhlIGludGVybmFsIGFycmF5IGluc3RlYWQgb2YgYWxsb2NhdGluZyBhIGZpbHRlcmVkIGNvcHkuXG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9nZXRDb21wb25lbnRzKExpZ2h0Q29tcG9uZW50KSBhc1xuICAgICAgfCAoTGlnaHRDb21wb25lbnQgfCB1bmRlZmluZWQpW11cbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGlmIChsaWdodENvbXBvbmVudHMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpZ2h0Q29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSBsaWdodENvbXBvbmVudHNbaV07XG4gICAgICBpZiAobGlnaHRDb21wb25lbnQgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBpZiAoIShsaWdodENvbXBvbmVudC5lbmFibGUgJiYgbGlnaHRDb21wb25lbnQuY2FzdFNoYWRvdykpIGNvbnRpbnVlO1xuICAgICAgaWYgKGxpZ2h0Q29tcG9uZW50LnR5cGUgIT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGxpZ2h0RW50aXR5ID0gbGlnaHRDb21wb25lbnQuZW50aXR5IGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHk7XG4gICAgICBjb25zdCBsaWdodFdvcmxkTWF0cml4ID0gbGlnaHRFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyO1xuICAgICAgY29uc3QgaW52ZXJzZUxpZ2h0TWF0cml4ID0gTWF0cml4NDQuaW52ZXJ0KGxpZ2h0V29ybGRNYXRyaXgpO1xuICAgICAgQUFCQi5tdWx0aXBseU1hdHJpeFRvKGludmVyc2VMaWdodE1hdHJpeCwgYm91bmRzLCBTaGFkb3dTeXN0ZW0uX190bXBMaWdodFNwYWNlQm91bmRzKTtcbiAgICAgIGNvbnN0IGxpZ2h0U3BhY2VCb3VuZHMgPSBTaGFkb3dTeXN0ZW0uX190bXBMaWdodFNwYWNlQm91bmRzO1xuICAgICAgY29uc3QgbWluID0gbGlnaHRTcGFjZUJvdW5kcy5taW5Qb2ludDtcbiAgICAgIGNvbnN0IG1heCA9IGxpZ2h0U3BhY2VCb3VuZHMubWF4UG9pbnQ7XG5cbiAgICAgIC8vIFRoZSBsaWdodCBjYW1lcmEgbG9va3MgYWxvbmcgaXRzIGxvY2FsIC1aLCBzbyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgY2FtZXJhIGlzIC16LlxuICAgICAgY29uc3QgZGVwdGhOZWFyID0gTWF0aC5tYXgoLW1heC56LCAwKTtcbiAgICAgIGNvbnN0IGRlcHRoRmFyID0gTWF0aC5tYXgoLW1pbi56LCBkZXB0aE5lYXIgKyAxZS0zKTtcbiAgICAgIGNvbnN0IHpOZWFyID0gTWF0aC5tYXgoZGVwdGhOZWFyIC8gbmVhckZhck1hcmdpbiwgMC4wMSk7XG4gICAgICBjb25zdCB6RmFyID0gTWF0aC5tYXgoZGVwdGhGYXIgKiBuZWFyRmFyTWFyZ2luLCB6TmVhciArIDAuMDEpO1xuXG4gICAgICAvLyBUaGUgb3J0aG9ncmFwaGljIHByb2plY3Rpb24gaXMgc3F1YXJlIGFuZCBzeW1tZXRyaWMgYXJvdW5kIHRoZSBsaWdodCdzIHZpZXcgYXhpcy5cbiAgICAgIGNvbnN0IGhhbGZFeHRlbnQgPSBNYXRoLm1heChNYXRoLmFicyhtaW4ueCksIE1hdGguYWJzKG1heC54KSwgTWF0aC5hYnMobWluLnkpLCBNYXRoLmFicyhtYXgueSksIDEuMCk7XG4gICAgICBjb25zdCBhcmVhU2l6ZSA9IGhhbGZFeHRlbnQgKiBhcmVhTWFyZ2luO1xuXG4gICAgICBsaWdodENvbXBvbmVudC5zaGFkb3dBcmVhU2l6ZUZvckRpcmVjdGlvbmFsTGlnaHQgPSBhcmVhU2l6ZTtcbiAgICAgIGxpZ2h0Q29tcG9uZW50LnNoYWRvd1pOZWFyRm9yRGlyZWN0aW9uYWxMaWdodCA9IHpOZWFyO1xuICAgICAgLy8gVGhlIGNhbWVyYSBzeW5jIHVzZXMgcmFuZ2UgZm9yIHpGYXIuXG4gICAgICBsaWdodENvbXBvbmVudC5yYW5nZSA9IHpGYXI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgbGlnaHQgY29uZmlndXJhdGlvbiBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGUuXG4gICAqIENvbXBhcmVzIHRoZSBjdXJyZW50IGxpZ2h0IHR5cGVzLCBlbmFibGUgc3RhdGVzLCBhbmQgc2hhZG93IGNhc3Rpbmcgc3RhdGVzIHdpdGggY2FjaGVkIHZhbHVlcy5cbiAgICogQWxzbyByZXR1cm5zIHRydWUgaWYgYSBtYW51YWwgcmVmcmVzaCB3YXMgcmVxdWVzdGVkIHZpYSBzZXROZWVkc1JlZnJlc2goKS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbnkgbGlnaHQgaGFzIGNoYW5nZWQgaXRzIHR5cGUsIGVuYWJsZSBzdGF0ZSwgb3Igc2hhZG93IGNhc3Rpbmcgc3RhdGU7IGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgcHVibGljIGlzTGlnaHRDaGFuZ2VkKCkge1xuICAgIGlmICh0aGlzLl9fbmVlZHNSZWZyZXNoKSB7XG4gICAgICB0aGlzLl9fbmVlZHNSZWZyZXNoID0gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBsaWdodENvbXBvbmVudHMgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKExpZ2h0Q29tcG9uZW50KSBhcyBMaWdodENvbXBvbmVudFtdO1xuXG4gICAgaWYgKHRoaXMuX19saWdodFR5cGVzLmxlbmd0aCAhPT0gbGlnaHRDb21wb25lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaWdodENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50ID0gbGlnaHRDb21wb25lbnRzW2ldO1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLl9fbGlnaHRUeXBlc1tpXSAhPT0gbGlnaHRDb21wb25lbnQudHlwZSB8fFxuICAgICAgICB0aGlzLl9fbGlnaHRFbmFibGVzW2ldICE9PSBsaWdodENvbXBvbmVudC5lbmFibGUgfHxcbiAgICAgICAgdGhpcy5fX2xpZ2h0Q2FzdFNoYWRvd3NbaV0gIT09IGxpZ2h0Q29tcG9uZW50LmNhc3RTaGFkb3cgfHxcbiAgICAgICAgdGhpcy5fX2xpZ2h0U2lkc1tpXSAhPT0gbGlnaHRDb21wb25lbnQuY29tcG9uZW50U0lEXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0cyBhIHJlZnJlc2ggb2Ygc2hhZG93IGV4cHJlc3Npb25zIG9uIHRoZSBuZXh0IGZyYW1lLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCB3aGVuIG1hdGVyaWFscyB3aXRoIHNoYWRvdyBzdXBwb3J0IGhhdmUgYmVlbiBjaGFuZ2VkIG9yIGFkZGVkLlxuICAgKi9cbiAgcHVibGljIHNldE5lZWRzUmVmcmVzaCgpIHtcbiAgICB0aGlzLl9fbmVlZHNSZWZyZXNoID0gdHJ1ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsaUJBQXFDO0FBQzlDLFNBQVMsbUJBQW1CO0FBQzVCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsd0JBQXdCO0FBRWpDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjO0FBQ3ZCLFNBQVMsa0JBQWtCO0FBSzNCLFNBQVMsZUFBZTtBQUN4QixTQUFTLCtCQUEwRTtBQUNuRixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGlCQUFpQjtBQW9DbkIsSUFBTSxnQkFBTixNQUFNLGNBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF5Q3hCLFlBQVksUUFBZ0IsZUFBdUI7QUFsQ25ELFNBQVFBLEtBQWdDLENBQUM7QUFDekMsU0FBUUMsS0FBNEIsQ0FBQztBQUNyQyxTQUFRQyxLQUFnQyxDQUFDO0FBQ3pDLFNBQVFDLEtBQXdCLENBQUM7QUFDakMsU0FBUUMsS0FBK0I7QUFPdkM7QUFBQSxTQUFRQyxLQUF1QjtBQUUvQjtBQUFBLFNBQVFDLEtBQTRDLENBQUM7QUFDckQs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S0EsS0FBaUI7QUFDdEIsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLGtCQUFrQixLQUFLRyxFQUFTLG9CQUFvQixzQkFBc0IsY0FBYztBQUU5RixRQUFJLEtBQUtmLEdBQWEsV0FBVyxnQkFBZ0IsUUFBUTtBQUN2RCxhQUFPO0FBQUEsSUFDVDtBQUVBLGFBQVMsSUFBSSxHQUFHLElBQUksZ0JBQWdCLFFBQVEsS0FBSztBQUMvQyxZQUFNLGlCQUFpQixnQkFBZ0IsQ0FBQztBQUN4QyxVQUNFLEtBQUtBLEdBQWEsQ0FBQyxNQUFNLGVBQWUsUUFDeEMsS0FBS0MsR0FBZSxDQUFDLE1BQU0sZUFBZSxVQUMxQyxLQUFLQyxHQUFtQixDQUFDLE1BQU0sZUFBZSxjQUM5QyxLQUFLQyxHQUFZLENBQUMsTUFBTSxlQUFlLGNBQ3ZDO0FBQ0EsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTU8sa0JBQWtCO0FBQ3ZCLFNBQUtTLEtBQWlCO0FBQUEsRUFDeEI7QUFDRjtBQTFpQ2EsY0E0Qkk2QixLQUF3QixJQUFJLEtBQUs7QUE1QjNDLElBQU0sZUFBTjsiLAogICJuYW1lcyI6IFsiX19saWdodFR5cGVzIiwgIl9fbGlnaHRFbmFibGVzIiwgIl9fbGlnaHRDYXN0U2hhZG93cyIsICJfX2xpZ2h0U2lkcyIsICJfX2lzU2hhZG93U2xvdFNob3J0YWdlV2FybmVkIiwgIl9fZGVwdGhCaWFzUFZWZXJzaW9uIiwgIl9fZGVwdGhCaWFzUFZWZXJzaW9uT2ZNYXRlcmlhbHMiLCAiX19sYXN0VHJhbnNmb3JtVXBkYXRlQ291bnRGb3JBdXRvRml0IiwgIl9fbGFzdEVudGl0eUNvdW50Rm9yQXV0b0ZpdCIsICJfX2xhc3RSYXltYXJjaGluZ0NvbXBvbmVudENvdW50Rm9yQXV0b0ZpdCIsICJfX2xhc3RSYXltYXJjaGluZ0FBQkJWZXJzaW9uRm9yQXV0b0ZpdCIsICJfX2xhc3RBdXRvRml0Qm91bmRzIiwgIl9fbmVlZHNSZWZyZXNoIiwgIl9fZGVwdGhUZXh0dXJlSW5kZXhMaXN0IiwgIl9fcG9pbnRMaWdodEZhclBsYW5lTGlzdCIsICJfX2VuZ2luZSIsICJfX3NoYWRvd01hcCIsICJfX3BvaW50U2hhZG93TWFwIiwgIl9fZ2F1c3NpYW5CbHVyIiwgIl9fc2hhZG93TWFwQXJyYXlGcmFtZWJ1ZmZlciIsICJfX3BvaW50U2hhZG93TWFwQXJyYXlGcmFtZWJ1ZmZlciIsICJfX3JheW1hcmNoaW5nU2hhZG93UGFzc1Byb3ZpZGVyIiwgIl9fYXV0b0ZpdERpcmVjdGlvbmFsTGlnaHRTaGFkb3dWb2x1bWUiLCAiX191cGRhdGVTcG90TGlnaHRTaGFkb3daTmVhciIsICJfX2lzU2hhZG93Q2FzdGVyIiwgIl9fYXNzaWduU2hhZG93U2xvdHMiLCAiX19nZXRQb2ludExpZ2h0RmFyUGxhbmUiLCAiX19zZXRQYXJhYm9sb2lkQmx1cnJlZFNoYWRvd01hcCIsICJfX3NldEJsdXJyZWRTaGFkb3dNYXAiLCAiX19zZXREZXB0aFRleHR1cmVJbmRleExpc3QiLCAiX19zZXRQb2ludExpZ2h0RmFyUGxhbmVMaXN0IiwgIl9fZGlyZWN0aW9uYWxTaGFkb3dNYXAiLCAiX19wYXJhYm9sb2lkU2hhZG93TWFwIiwgIl9fZ2V0U2NlbmVGYXJQbGFuZUZvclBvaW50TGlnaHQiLCAiX19pc0xpZ2h0RW50aXR5IiwgIl9fZGVwdGhCaWFzUFZBcnJheSIsICJfX2RlcHRoQmlhc1BWIiwgIl9fZGVwdGhCaWFzUFZTY3JhdGNoIiwgIl9fZ2V0UmF5bWFyY2hpbmdDb21wb25lbnRDb3VudCIsICJfX2FwcGx5QXV0b0ZpdFRvRGlyZWN0aW9uYWxMaWdodHMiLCAiX19tZXJnZVJheW1hcmNoaW5nU2hhZG93Qm91bmRzIiwgIl9fdG1wTGlnaHRTcGFjZUJvdW5kcyJdCn0K
