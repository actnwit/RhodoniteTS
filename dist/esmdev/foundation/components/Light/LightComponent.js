// src/foundation/components/Light/LightComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { BufferUse } from "../../definitions/BufferUse.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { LightType } from "../../definitions/LightType.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { _getGizmoClass } from "../../gizmos/GizmoRegistry.js";
import { MutableVector3 } from "../../math/index.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Scalar } from "../../math/Scalar.js";
import { Vector3 } from "../../math/Vector3.js";
import { Is } from "../../misc/Is.js";
import { TransformComponent } from "../Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var _LightComponent = class _LightComponent extends Component {
  /**
   * Creates a new LightComponent instance.
   *
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityRepository - The entity repository instance
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.__type = LightType.Point;
    this.__color = Vector3.fromCopyArray([1, 1, 1]);
    /** The components of the color at the last change, to detect changes of a mutated color object. */
    this.__lastColor = [1, 1, 1];
    this.__intensity = 1;
    this.__initialDirection = Vector3.fromCopyArray([0, 0, -1]);
    this.__direction = Vector3.fromCopyArray([0, 0, -1]);
    this.__innerConeAngle = 0;
    this.__outerConeAngle = Math.PI / 4;
    // in radian
    this.__range = -1;
    this.__enable = true;
    this.__shadowAreaSizeForDirectionalLight = 10;
    this.__shadowZNearForDirectionalLight = 0.1;
    this.__shadowZNearForSpotLight = 0.1;
    this.__isShadowZNearForSpotLightAuto = true;
    this.__pointLightShadowFarPlane = -1;
    this.__shadowCameraOffsetForDirectionalLight = Vector3.zero();
    this.castShadow = false;
    this._lightPosition = MutableVector4.dummy();
    this._lightDirection = MutableVector4.dummy();
    this._lightIntensity = MutableVector4.dummy();
    this._lightProperty = MutableVector4.dummy();
    /** The shadow slot assigned by a ShadowSystem. `undefined` means the default slot (see `_shadowSlot`). */
    this.__shadowSlot = void 0;
    this.__updateCount = 0;
    this.__lastUpdateCount = -1;
    this.__lastTransformUpdateCount = -1;
    this.__lastRangeScale = -1;
    this.submitToAllocation(engine.config.lightComponentCountPerBufferView, isReUse);
    _LightComponent.__incrementUpdateCount(engine);
  }
  /**
   * Gets the number of changes of all light components of the engine (creation, destruction and property changes).
   * The engine and the rendering strategies use it to process and upload the light data only when it changed.
   *
   * @param engine - The engine instance
   * @returns The update count
   */
  static getUpdateCount(engine) {
    var _a;
    return (_a = this.__updateCountMap.get(engine)) != null ? _a : 0;
  }
  static __incrementUpdateCount(engine) {
    var _a;
    this.__updateCountMap.set(engine, ((_a = this.__updateCountMap.get(engine)) != null ? _a : 0) + 1);
  }
  /**
   * Cleans up the static data of the engine.
   * @internal
   */
  static _cleanupForEngine(engine) {
    this.__updateCountMap.delete(engine);
  }
  /**
   * Records a change of a property, so that the light data is recomputed and uploaded.
   */
  __markUpdated() {
    this.__updateCount++;
    _LightComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Gets the type of the light.
   */
  get type() {
    return this.__type;
  }
  /**
   * Sets the type of the light.
   */
  set type(value) {
    if (this.__type !== value) {
      this.__type = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets whether the light is enabled.
   */
  get enable() {
    return this.__enable;
  }
  /**
   * Sets whether the light is enabled. A disabled light does not light anything.
   */
  set enable(value) {
    if (this.__enable !== value) {
      this.__enable = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the inner cone angle of the spot light (in radian).
   */
  get innerConeAngle() {
    return this.__innerConeAngle;
  }
  /**
   * Sets the inner cone angle of the spot light (in radian).
   */
  set innerConeAngle(value) {
    if (this.__innerConeAngle !== value) {
      this.__innerConeAngle = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the outer cone angle of the spot light (in radian).
   */
  get outerConeAngle() {
    return this.__outerConeAngle;
  }
  /**
   * Sets the outer cone angle of the spot light (in radian).
   */
  set outerConeAngle(value) {
    if (this.__outerConeAngle !== value) {
      this.__outerConeAngle = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the component type identifier for LightComponent.
   *
   * @returns The component type identifier
   */
  static get componentTID() {
    return WellKnownComponentTIDs.LightComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   *
   * @returns The component type identifier
   */
  get componentTID() {
    return WellKnownComponentTIDs.LightComponentTID;
  }
  /**
   * Gets the current update count of this light component.
   * The update count is incremented whenever the light properties change.
   *
   * @returns The current update count
   */
  get updateCount() {
    return this.__updateCount;
  }
  /**
   * Gets the current direction vector of the light.
   * This direction is calculated based on the transform component's rotation.
   *
   * @returns The normalized direction vector
   */
  get direction() {
    return this.__direction;
  }
  /**
   * Sets the intensity of the light.
   *
   * @param value - The intensity value (typically 0.0 to 1.0, but can be higher for HDR)
   */
  set intensity(value) {
    if (this.__intensity !== value) {
      this.__intensity = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the intensity of the light.
   *
   * @returns The current intensity value
   */
  get intensity() {
    return this.__intensity;
  }
  /**
   * Sets the effective range of the light.
   *
   * @remarks
   * This value is used for:
   * - SpotLight shadow camera zFar (when shadow mapping is enabled)
   * - DirectionalLight shadow camera zFar fallback (when range !== -1)
   * - Shading attenuation / light property uniforms
   *
   * Updating this property increments updateCount so dependent systems can react.
   */
  set range(value) {
    if (this.__range !== value) {
      this.__range = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the effective range of the light.
   */
  get range() {
    return this.__range;
  }
  /**
   * Sets the orthographic half-size used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set orthographic extents.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowAreaSizeForDirectionalLight(value) {
    if (this.__shadowAreaSizeForDirectionalLight !== value) {
      this.__shadowAreaSizeForDirectionalLight = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the orthographic half-size used for DirectionalLight shadow camera.
   */
  get shadowAreaSizeForDirectionalLight() {
    return this.__shadowAreaSizeForDirectionalLight;
  }
  /**
   * Sets the zNear value used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set zNear.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowZNearForDirectionalLight(value) {
    if (this.__shadowZNearForDirectionalLight !== value) {
      this.__shadowZNearForDirectionalLight = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the zNear value used for DirectionalLight shadow camera.
   */
  get shadowZNearForDirectionalLight() {
    return this.__shadowZNearForDirectionalLight;
  }
  /**
   * Sets the zNear value of the SpotLight shadow camera.
   *
   * @remarks
   * A larger zNear makes the perspective depth of the shadow map more linear, which
   * improves the contrast of variance shadow maps. It must stay below the distance
   * from the light to the nearest shadow caster, or that caster is clipped.
   * Setting this property disables the automatic fitting of `ShadowSystem`
   * (`isShadowZNearForSpotLightAuto` becomes false).
   * Updating this property increments updateCount so the camera sync is refreshed.
   */
  set shadowZNearForSpotLight(value) {
    if (this.__shadowZNearForSpotLight !== value || this.__isShadowZNearForSpotLightAuto) {
      this.__shadowZNearForSpotLight = value;
      this.__isShadowZNearForSpotLightAuto = false;
      this.__markUpdated();
    }
  }
  /**
   * Gets the zNear value used for SpotLight shadow camera.
   */
  get shadowZNearForSpotLight() {
    return this.__shadowZNearForSpotLight;
  }
  /**
   * Sets the far plane of the paraboloid shadow map of this PointLight.
   *
   * @remarks
   * The far plane normalizes the stored depth. A smaller value keeps the blurred
   * background out of the shadow moments, but receivers farther than the far plane
   * cannot be shaded correctly. -1 (the default) fits it automatically: the light's
   * effective range when available, otherwise the farthest shadow receiver in the scene.
   * Updating this property increments updateCount.
   */
  set pointLightShadowFarPlane(value) {
    if (this.__pointLightShadowFarPlane !== value) {
      this.__pointLightShadowFarPlane = value;
      this.__markUpdated();
    }
  }
  /**
   * Gets the explicit far plane of the PointLight shadow map (-1: automatic).
   */
  get pointLightShadowFarPlane() {
    return this.__pointLightShadowFarPlane;
  }
  /**
   * Whether the SpotLight shadow camera zNear is fitted automatically from the
   * distance to the nearest shadow caster.
   */
  get isShadowZNearForSpotLightAuto() {
    return this.__isShadowZNearForSpotLightAuto;
  }
  /**
   * Sets the automatically fitted zNear value. Does nothing when the user set
   * `shadowZNearForSpotLight` explicitly.
   * @internal
   */
  _setShadowZNearForSpotLightAuto(value) {
    if (!this.__isShadowZNearForSpotLightAuto) {
      return;
    }
    if (this.__shadowZNearForSpotLight !== value) {
      this.__shadowZNearForSpotLight = value;
      this.__markUpdated();
    }
  }
  /**
   * Sets the shadow camera offset for DirectionalLight.
   * This offset is applied to position the shadow camera at the scene center.
   */
  set shadowCameraOffsetForDirectionalLight(value) {
    this.__shadowCameraOffsetForDirectionalLight = value;
    this.__markUpdated();
  }
  /**
   * Gets the shadow camera offset for DirectionalLight.
   */
  get shadowCameraOffsetForDirectionalLight() {
    return this.__shadowCameraOffsetForDirectionalLight;
  }
  /**
   * Sets the color of the light.
   *
   * @param value - The RGB color vector (values typically 0.0 to 1.0)
   */
  set color(value) {
    this.__color = value;
    const last = this.__lastColor;
    if (last[0] !== value.x || last[1] !== value.y || last[2] !== value.z) {
      last[0] = value.x;
      last[1] = value.y;
      last[2] = value.z;
      this.__markUpdated();
    }
  }
  /**
   * Gets the color of the light.
   *
   * @returns The RGB color vector
   */
  get color() {
    return this.__color;
  }
  /**
   * The index of the shadow data of this light in the per-material shadow arrays
   * (`depthTextureIndexList` and `depthBiasPV`), or -1 when the light has no shadow data.
   *
   * @remarks
   * A ShadowSystem assigns the slots of the lights it manages. Otherwise the slot is the component SID
   * when it is below `Config.maxLightNumber`, which is the convention of manual shadow map setups.
   *
   * @internal
   */
  get _shadowSlot() {
    if (this.__shadowSlot !== void 0) {
      return this.__shadowSlot;
    }
    return this.componentSID < this.__engine.config.maxLightNumber ? this.componentSID : -1;
  }
  /**
   * Sets the shadow slot of this light. `undefined` restores the default slot.
   *
   * @internal
   */
  set _shadowSlot(slot) {
    this.__shadowSlot = slot;
  }
  /**
   * The world position of the light as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightPositionForGpu() {
    return this._lightPosition;
  }
  /**
   * The world direction of the light as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightDirectionForGpu() {
    return this._lightDirection;
  }
  /**
   * The light property (type, effective range, cos of the inner and outer cone angles) as uploaded to the GPU
   * (updated in $logic).
   *
   * @internal
   */
  get _lightPropertyForGpu() {
    return this._lightProperty;
  }
  /**
   * The intensity of the light (color * intensity) as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightIntensityForGpu() {
    return this._lightIntensity;
  }
  /**
   * Gets the up vector for the light in local space.
   * This is used for light orientation calculations.
   *
   * @returns The up vector (0, 1, 0)
   */
  get _up() {
    return Vector3.fromCopy3(0, 1, 0);
  }
  /**
   * Sets the visibility of the light gizmo in the editor.
   * When enabled, creates and shows a visual representation of the light.
   *
   * @param flg - True to show the gizmo, false to hide it
   */
  set isLightGizmoVisible(flg) {
    if (flg) {
      if (Is.not.defined(this.__lightGizmo)) {
        this.__lightGizmo = new (_getGizmoClass("light"))(this.entity.engine, this.entity);
        this.__lightGizmo._setup();
      }
      this.__lightGizmo.isVisible = true;
    } else {
      if (Is.defined(this.__lightGizmo)) {
        this.__lightGizmo.isVisible = false;
      }
    }
    this.__markUpdated();
  }
  /**
   * Gets the visibility state of the light gizmo.
   *
   * @returns True if the gizmo is visible, false otherwise
   */
  get isLightGizmoVisible() {
    if (Is.defined(this.__lightGizmo)) {
      return this.__lightGizmo.isVisible;
    }
    return false;
  }
  /**
   * Initializes the light component by loading global data repositories.
   * This method is called during the component loading phase.
   */
  $load() {
    _LightComponent.__lightNumber = this.entity.engine.globalDataRepository.getValue("lightNumber", 0);
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Updates the light gizmo if it exists and is visible.
   * This is called internally during the logic update phase.
   *
   * @private
   */
  __updateGizmo() {
    if (Is.defined(this.__lightGizmo) && this.__lightGizmo.isSetup && this.isLightGizmoVisible) {
      this.__lightGizmo._update();
    }
  }
  /**
   * Common logic update method that runs once per frame for all light components.
   * Updates the global light count for the shader system.
   *
   * @static
   */
  static common_$logic({ engine }) {
    const lightComponents = engine.componentRepository.getComponentsWithType(_LightComponent);
    _LightComponent.__lightNumber._v[0] = lightComponents.length;
  }
  /**
   * Updates the light component's state and uploads data to the GPU.
   * This method calculates the light direction, position, and properties,
   * then stores them in global data arrays for shader access.
   *
   * @remarks
   * This method implements performance optimization by checking update counts
   * to avoid unnecessary recalculations when nothing has changed.
   */
  $logic() {
    const rangeScale = this.__engine.config.lightRangeScale;
    if (TransformComponent.getUpdateCount(this.__engine) === this.__lastTransformUpdateCount && this.__lastUpdateCount === this.__updateCount && this.__lastRangeScale === rangeScale) {
      return;
    }
    const sceneGraphComponent = this.entity.getSceneGraph();
    if (this.type === LightType.Spot || this.type === LightType.Directional) {
      this.__direction = sceneGraphComponent.normalMatrixInner.multiplyVector(this.__initialDirection);
      this._lightDirection._v[0] = this.__direction.x;
      this._lightDirection._v[1] = this.__direction.y;
      this._lightDirection._v[2] = this.__direction.z;
    }
    const innerConeCos = Math.cos(this.innerConeAngle);
    const outerConeCos = Math.cos(this.outerConeAngle);
    const lightPosition = sceneGraphComponent.worldPosition;
    this._lightPosition._v[0] = lightPosition.x;
    this._lightPosition._v[1] = lightPosition.y;
    this._lightPosition._v[2] = lightPosition.z;
    const effectiveRange = this.__getEffectiveRange();
    const isRangedLocalLight = (this.type === LightType.Point || this.type === LightType.Spot) && effectiveRange > 0;
    const intensityScale = isRangedLocalLight ? _LightComponent.__getIntensityScale(rangeScale) : 1;
    const appliedRangeScale = isRangedLocalLight ? rangeScale : 1;
    this._lightIntensity._v[0] = this.__color.x * this.__intensity * intensityScale;
    this._lightIntensity._v[1] = this.__color.y * this.__intensity * intensityScale;
    this._lightIntensity._v[2] = this.__color.z * this.__intensity * intensityScale;
    this._lightProperty._v[0] = this.enable ? this.type.index : -1;
    this._lightProperty._v[1] = effectiveRange * appliedRangeScale;
    this._lightProperty._v[2] = innerConeCos;
    this._lightProperty._v[3] = outerConeCos;
    this.__updateGizmo();
    this.__lastTransformUpdateCount = TransformComponent.getUpdateCount(this.__engine);
    this.__lastUpdateCount = this.__updateCount;
    this.__lastRangeScale = rangeScale;
  }
  /**
   * Returns the intensity factor that compensates the shortened range. The factors are the measured brightness
   * balance of the Sponza scene: 0.9 -> 1.16 and 0.8 -> 1.35. Values in between interpolate; below 0.8 the last
   * slope continues. A constant factor compensates the range window approximately, not exactly.
   */
  static __getIntensityScale(rangeScale) {
    if (rangeScale >= 1) {
      return 1;
    }
    if (rangeScale >= 0.9) {
      return 1 + (1 - rangeScale) * 1.6;
    }
    if (rangeScale >= 0.8) {
      return 1.16 + (0.9 - rangeScale) * 1.9;
    }
    return 1.35 + (0.8 - rangeScale) * 1.9;
  }
  /**
   * Returns the range used for shading. Point and spot lights without a range get an automatic range
   * when `Config.lightAutoRangeThreshold` is greater than 0.
   */
  __getEffectiveRange() {
    const threshold = this.__engine.config.lightAutoRangeThreshold;
    if (this.__range > 0 || !(threshold > 0) || this.type !== LightType.Point && this.type !== LightType.Spot) {
      return this.__range;
    }
    const maxIntensity = Math.max(this.__color.x, this.__color.y, this.__color.z) * this.__intensity;
    return Math.max(Math.sqrt(Math.max(maxIntensity, 0) / threshold), 1e-6);
  }
  /**
   * Cleans up the light component when it's being destroyed.
   * Resets the light intensity values in the global data arrays.
   *
   * @override
   */
  _destroy() {
    super._destroy();
    _LightComponent.__incrementUpdateCount(this.__engine);
  }
  /**
   * Gets the entity that owns this light component.
   *
   * @returns The light entity instance with light-specific methods
   */
  get entity() {
    return this.__engine.entityRepository.getEntity(this.__entityUid);
  }
  /**
   * Adds light-specific methods to an entity class through mixin composition.
   * This method extends the base entity with light component functionality.
   *
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   * @param base - The base entity instance to extend
   * @param _componentClass - The component class (unused but required for type compatibility)
   * @returns The extended entity with light component methods
   */
  addThisComponentToEntity(base, _componentClass) {
    class LightEntity extends base.constructor {
      getLight() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.LightComponentTID);
      }
    }
    applyMixins(base, LightEntity);
    return base;
  }
};
_LightComponent.__lightNumber = Scalar.zero();
/** The number of changes of all light components, per engine. */
_LightComponent.__updateCountMap = /* @__PURE__ */ new Map();
var LightComponent = _LightComponent;
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "lightPosition",
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0]
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "lightDirection",
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0]
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "lightIntensity",
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0]
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "lightProperty",
  dataClassType: MutableVector4,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec4,
  componentType: ComponentType.Float,
  initValues: [-1, 0, 0, 0]
});
export {
  LightComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9MaWdodC9MaWdodENvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlEIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExpZ2h0VHlwZSwgdHlwZSBMaWdodFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBfZ2V0R2l6bW9DbGFzcyB9IGZyb20gJy4uLy4uL2dpem1vcy9HaXptb1JlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHsgTGlnaHRHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9MaWdodEdpem1vJztcbmltcG9ydCB0eXBlIHsgSUxpZ2h0RW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yNCc7XG5pbXBvcnQgeyBTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoL1NjYWxhcic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vLi4vbWlzYy9Jcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcblxuLyoqXG4gKiBUaGUgQ29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIGxpZ2h0LlxuICpcbiAqIEByZW1hcmtzXG4gKiB0aGUgbGlnaHQgbG9va3MgdG93YXJkcyB0aGUgbG9jYWwgLVogYXhpcyBpbiByaWdodCBoYW5kIGNvb3JkaW5hdGUgc3lzdGVtLlxuICovXG5leHBvcnQgY2xhc3MgTGlnaHRDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIF9fdHlwZSA9IExpZ2h0VHlwZS5Qb2ludDtcbiAgcHJpdmF0ZSBfX2NvbG9yID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsxLCAxLCAxXSk7XG4gIC8qKiBUaGUgY29tcG9uZW50cyBvZiB0aGUgY29sb3IgYXQgdGhlIGxhc3QgY2hhbmdlLCB0byBkZXRlY3QgY2hhbmdlcyBvZiBhIG11dGF0ZWQgY29sb3Igb2JqZWN0LiAqL1xuICBwcml2YXRlIF9fbGFzdENvbG9yID0gWzEsIDEsIDFdO1xuICBwcml2YXRlIF9faW50ZW5zaXR5ID0gMTtcbiAgcHJpdmF0ZSByZWFkb25seSBfX2luaXRpYWxEaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIC0xXSk7XG4gIHByaXZhdGUgX19kaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIC0xXSk7XG4gIHByaXZhdGUgX19pbm5lckNvbmVBbmdsZSA9IDAuMDtcbiAgcHJpdmF0ZSBfX291dGVyQ29uZUFuZ2xlID0gTWF0aC5QSSAvIDQuMDsgLy8gaW4gcmFkaWFuXG4gIHByaXZhdGUgX19yYW5nZSA9IC0xO1xuICBwcml2YXRlIF9fZW5hYmxlID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfX3NoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCA9IDEwO1xuICBwcml2YXRlIF9fc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0ID0gMC4xO1xuICBwcml2YXRlIF9fc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSAwLjE7XG4gIHByaXZhdGUgX19pc1NoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byA9IHRydWU7XG4gIHByaXZhdGUgX19wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUgPSAtMTtcbiAgcHJpdmF0ZSBfX3NoYWRvd0NhbWVyYU9mZnNldEZvckRpcmVjdGlvbmFsTGlnaHQgPSBWZWN0b3IzLnplcm8oKTtcbiAgcHVibGljIGNhc3RTaGFkb3cgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbGlnaHRQb3NpdGlvbiA9IE11dGFibGVWZWN0b3I0LmR1bW15KCk7XG4gIHByaXZhdGUgX2xpZ2h0RGlyZWN0aW9uID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfbGlnaHRJbnRlbnNpdHkgPSBNdXRhYmxlVmVjdG9yNC5kdW1teSgpO1xuICBwcml2YXRlIF9saWdodFByb3BlcnR5ID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19saWdodE51bWJlciA9IFNjYWxhci56ZXJvKCk7XG4gIHByaXZhdGUgX19saWdodEdpem1vPzogTGlnaHRHaXptbztcbiAgLyoqIFRoZSBzaGFkb3cgc2xvdCBhc3NpZ25lZCBieSBhIFNoYWRvd1N5c3RlbS4gYHVuZGVmaW5lZGAgbWVhbnMgdGhlIGRlZmF1bHQgc2xvdCAoc2VlIGBfc2hhZG93U2xvdGApLiAqL1xuICBwcml2YXRlIF9fc2hhZG93U2xvdDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIHByaXZhdGUgX191cGRhdGVDb3VudCA9IDA7XG4gIHByaXZhdGUgX19sYXN0VXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFJhbmdlU2NhbGUgPSAtMTtcbiAgLyoqIFRoZSBudW1iZXIgb2YgY2hhbmdlcyBvZiBhbGwgbGlnaHQgY29tcG9uZW50cywgcGVyIGVuZ2luZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudE1hcDogTWFwPEVuZ2luZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBMaWdodENvbXBvbmVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRoaXMgY29tcG9uZW50IGJlbG9uZ3MgdG9cbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBjb21wb25lbnQgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgZW50aXR5IHJlcG9zaXRvcnkgaW5zdGFuY2VcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCBmcm9tIGEgcG9vbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuXG4gICAgdGhpcy5zdWJtaXRUb0FsbG9jYXRpb24oZW5naW5lLmNvbmZpZy5saWdodENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldywgaXNSZVVzZSk7XG4gICAgTGlnaHRDb21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudChlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBjaGFuZ2VzIG9mIGFsbCBsaWdodCBjb21wb25lbnRzIG9mIHRoZSBlbmdpbmUgKGNyZWF0aW9uLCBkZXN0cnVjdGlvbiBhbmQgcHJvcGVydHkgY2hhbmdlcykuXG4gICAqIFRoZSBlbmdpbmUgYW5kIHRoZSByZW5kZXJpbmcgc3RyYXRlZ2llcyB1c2UgaXQgdG8gcHJvY2VzcyBhbmQgdXBsb2FkIHRoZSBsaWdodCBkYXRhIG9ubHkgd2hlbiBpdCBjaGFuZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlIGNvdW50XG4gICAqL1xuICBzdGF0aWMgZ2V0VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9faW5jcmVtZW50VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnRNYXAuc2V0KGVuZ2luZSwgKHRoaXMuX191cGRhdGVDb3VudE1hcC5nZXQoZW5naW5lKSA/PyAwKSArIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgc3RhdGljIGRhdGEgb2YgdGhlIGVuZ2luZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZGVsZXRlKGVuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBhIGNoYW5nZSBvZiBhIHByb3BlcnR5LCBzbyB0aGF0IHRoZSBsaWdodCBkYXRhIGlzIHJlY29tcHV0ZWQgYW5kIHVwbG9hZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX21hcmtVcGRhdGVkKCkge1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdHlwZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBnZXQgdHlwZSgpOiBMaWdodFR5cGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHlwZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBzZXQgdHlwZSh2YWx1ZTogTGlnaHRUeXBlRW51bSkge1xuICAgIGlmICh0aGlzLl9fdHlwZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX190eXBlID0gdmFsdWU7XG4gICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIHRoZSBsaWdodCBpcyBlbmFibGVkLlxuICAgKi9cbiAgZ2V0IGVuYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2VuYWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIGxpZ2h0IGlzIGVuYWJsZWQuIEEgZGlzYWJsZWQgbGlnaHQgZG9lcyBub3QgbGlnaHQgYW55dGhpbmcuXG4gICAqL1xuICBzZXQgZW5hYmxlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX19lbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl9fZW5hYmxlID0gdmFsdWU7XG4gICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5uZXIgY29uZSBhbmdsZSBvZiB0aGUgc3BvdCBsaWdodCAoaW4gcmFkaWFuKS5cbiAgICovXG4gIGdldCBpbm5lckNvbmVBbmdsZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9faW5uZXJDb25lQW5nbGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5uZXIgY29uZSBhbmdsZSBvZiB0aGUgc3BvdCBsaWdodCAoaW4gcmFkaWFuKS5cbiAgICovXG4gIHNldCBpbm5lckNvbmVBbmdsZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19pbm5lckNvbmVBbmdsZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19pbm5lckNvbmVBbmdsZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG91dGVyIGNvbmUgYW5nbGUgb2YgdGhlIHNwb3QgbGlnaHQgKGluIHJhZGlhbikuXG4gICAqL1xuICBnZXQgb3V0ZXJDb25lQW5nbGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX291dGVyQ29uZUFuZ2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG91dGVyIGNvbmUgYW5nbGUgb2YgdGhlIHNwb3QgbGlnaHQgKGluIHJhZGlhbikuXG4gICAqL1xuICBzZXQgb3V0ZXJDb25lQW5nbGUodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fb3V0ZXJDb25lQW5nbGUgIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl9fb3V0ZXJDb25lQW5nbGUgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBMaWdodENvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLkxpZ2h0Q29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTGlnaHRDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB1cGRhdGUgY291bnQgb2YgdGhpcyBsaWdodCBjb21wb25lbnQuXG4gICAqIFRoZSB1cGRhdGUgY291bnQgaXMgaW5jcmVtZW50ZWQgd2hlbmV2ZXIgdGhlIGxpZ2h0IHByb3BlcnRpZXMgY2hhbmdlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB1cGRhdGUgY291bnRcbiAgICovXG4gIGdldCB1cGRhdGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgZGlyZWN0aW9uIHZlY3RvciBvZiB0aGUgbGlnaHQuXG4gICAqIFRoaXMgZGlyZWN0aW9uIGlzIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIHRyYW5zZm9ybSBjb21wb25lbnQncyByb3RhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgZGlyZWN0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGRpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2RpcmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlbnNpdHkgb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZW5zaXR5IHZhbHVlICh0eXBpY2FsbHkgMC4wIHRvIDEuMCwgYnV0IGNhbiBiZSBoaWdoZXIgZm9yIEhEUilcbiAgICovXG4gIHNldCBpbnRlbnNpdHkodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9faW50ZW5zaXR5ICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX2ludGVuc2l0eSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGludGVuc2l0eSB2YWx1ZVxuICAgKi9cbiAgZ2V0IGludGVuc2l0eSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9faW50ZW5zaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGVmZmVjdGl2ZSByYW5nZSBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgdmFsdWUgaXMgdXNlZCBmb3I6XG4gICAqIC0gU3BvdExpZ2h0IHNoYWRvdyBjYW1lcmEgekZhciAod2hlbiBzaGFkb3cgbWFwcGluZyBpcyBlbmFibGVkKVxuICAgKiAtIERpcmVjdGlvbmFsTGlnaHQgc2hhZG93IGNhbWVyYSB6RmFyIGZhbGxiYWNrICh3aGVuIHJhbmdlICE9PSAtMSlcbiAgICogLSBTaGFkaW5nIGF0dGVudWF0aW9uIC8gbGlnaHQgcHJvcGVydHkgdW5pZm9ybXNcbiAgICpcbiAgICogVXBkYXRpbmcgdGhpcyBwcm9wZXJ0eSBpbmNyZW1lbnRzIHVwZGF0ZUNvdW50IHNvIGRlcGVuZGVudCBzeXN0ZW1zIGNhbiByZWFjdC5cbiAgICovXG4gIHNldCByYW5nZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19yYW5nZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19yYW5nZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVmZmVjdGl2ZSByYW5nZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBnZXQgcmFuZ2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3JhbmdlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9ydGhvZ3JhcGhpYyBoYWxmLXNpemUgdXNlZCBmb3IgRGlyZWN0aW9uYWxMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBDYW1lcmFDb21wb25lbnQgc3luY3MgdG8gbGlnaHQgZWFjaCBmcmFtZSBhbmQgdXNlcyB0aGlzIHRvIHNldCBvcnRob2dyYXBoaWMgZXh0ZW50cy5cbiAgICogVXBkYXRpbmcgdGhpcyBwcm9wZXJ0eSBpbmNyZW1lbnRzIHVwZGF0ZUNvdW50IHNvIGNhbWVyYSBzeW5jIGlzIHJlZnJlc2hlZC5cbiAgICovXG4gIHNldCBzaGFkb3dBcmVhU2l6ZUZvckRpcmVjdGlvbmFsTGlnaHQodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fc2hhZG93QXJlYVNpemVGb3JEaXJlY3Rpb25hbExpZ2h0ICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX3NoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9ydGhvZ3JhcGhpYyBoYWxmLXNpemUgdXNlZCBmb3IgRGlyZWN0aW9uYWxMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKi9cbiAgZ2V0IHNoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZG93QXJlYVNpemVGb3JEaXJlY3Rpb25hbExpZ2h0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHpOZWFyIHZhbHVlIHVzZWQgZm9yIERpcmVjdGlvbmFsTGlnaHQgc2hhZG93IGNhbWVyYS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQ2FtZXJhQ29tcG9uZW50IHN5bmNzIHRvIGxpZ2h0IGVhY2ggZnJhbWUgYW5kIHVzZXMgdGhpcyB0byBzZXQgek5lYXIuXG4gICAqIFVwZGF0aW5nIHRoaXMgcHJvcGVydHkgaW5jcmVtZW50cyB1cGRhdGVDb3VudCBzbyBjYW1lcmEgc3luYyBpcyByZWZyZXNoZWQuXG4gICAqL1xuICBzZXQgc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0KHZhbHVlOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX3NoYWRvd1pOZWFyRm9yRGlyZWN0aW9uYWxMaWdodCAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19zaGFkb3daTmVhckZvckRpcmVjdGlvbmFsTGlnaHQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB6TmVhciB2YWx1ZSB1c2VkIGZvciBEaXJlY3Rpb25hbExpZ2h0IHNoYWRvdyBjYW1lcmEuXG4gICAqL1xuICBnZXQgc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkb3daTmVhckZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgek5lYXIgdmFsdWUgb2YgdGhlIFNwb3RMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIGxhcmdlciB6TmVhciBtYWtlcyB0aGUgcGVyc3BlY3RpdmUgZGVwdGggb2YgdGhlIHNoYWRvdyBtYXAgbW9yZSBsaW5lYXIsIHdoaWNoXG4gICAqIGltcHJvdmVzIHRoZSBjb250cmFzdCBvZiB2YXJpYW5jZSBzaGFkb3cgbWFwcy4gSXQgbXVzdCBzdGF5IGJlbG93IHRoZSBkaXN0YW5jZVxuICAgKiBmcm9tIHRoZSBsaWdodCB0byB0aGUgbmVhcmVzdCBzaGFkb3cgY2FzdGVyLCBvciB0aGF0IGNhc3RlciBpcyBjbGlwcGVkLlxuICAgKiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgZGlzYWJsZXMgdGhlIGF1dG9tYXRpYyBmaXR0aW5nIG9mIGBTaGFkb3dTeXN0ZW1gXG4gICAqIChgaXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG9gIGJlY29tZXMgZmFsc2UpLlxuICAgKiBVcGRhdGluZyB0aGlzIHByb3BlcnR5IGluY3JlbWVudHMgdXBkYXRlQ291bnQgc28gdGhlIGNhbWVyYSBzeW5jIGlzIHJlZnJlc2hlZC5cbiAgICovXG4gIHNldCBzaGFkb3daTmVhckZvclNwb3RMaWdodCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCAhPT0gdmFsdWUgfHwgdGhpcy5fX2lzU2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKSB7XG4gICAgICB0aGlzLl9fc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19pc1NoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byA9IGZhbHNlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHpOZWFyIHZhbHVlIHVzZWQgZm9yIFNwb3RMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKi9cbiAgZ2V0IHNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmYXIgcGxhbmUgb2YgdGhlIHBhcmFib2xvaWQgc2hhZG93IG1hcCBvZiB0aGlzIFBvaW50TGlnaHQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBmYXIgcGxhbmUgbm9ybWFsaXplcyB0aGUgc3RvcmVkIGRlcHRoLiBBIHNtYWxsZXIgdmFsdWUga2VlcHMgdGhlIGJsdXJyZWRcbiAgICogYmFja2dyb3VuZCBvdXQgb2YgdGhlIHNoYWRvdyBtb21lbnRzLCBidXQgcmVjZWl2ZXJzIGZhcnRoZXIgdGhhbiB0aGUgZmFyIHBsYW5lXG4gICAqIGNhbm5vdCBiZSBzaGFkZWQgY29ycmVjdGx5LiAtMSAodGhlIGRlZmF1bHQpIGZpdHMgaXQgYXV0b21hdGljYWxseTogdGhlIGxpZ2h0J3NcbiAgICogZWZmZWN0aXZlIHJhbmdlIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgdGhlIGZhcnRoZXN0IHNoYWRvdyByZWNlaXZlciBpbiB0aGUgc2NlbmUuXG4gICAqIFVwZGF0aW5nIHRoaXMgcHJvcGVydHkgaW5jcmVtZW50cyB1cGRhdGVDb3VudC5cbiAgICovXG4gIHNldCBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmUodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fcG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX3BvaW50TGlnaHRTaGFkb3dGYXJQbGFuZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV4cGxpY2l0IGZhciBwbGFuZSBvZiB0aGUgUG9pbnRMaWdodCBzaGFkb3cgbWFwICgtMTogYXV0b21hdGljKS5cbiAgICovXG4gIGdldCBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3BvaW50TGlnaHRTaGFkb3dGYXJQbGFuZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBTcG90TGlnaHQgc2hhZG93IGNhbWVyYSB6TmVhciBpcyBmaXR0ZWQgYXV0b21hdGljYWxseSBmcm9tIHRoZVxuICAgKiBkaXN0YW5jZSB0byB0aGUgbmVhcmVzdCBzaGFkb3cgY2FzdGVyLlxuICAgKi9cbiAgZ2V0IGlzU2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG87XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXV0b21hdGljYWxseSBmaXR0ZWQgek5lYXIgdmFsdWUuIERvZXMgbm90aGluZyB3aGVuIHRoZSB1c2VyIHNldFxuICAgKiBgc2hhZG93Wk5lYXJGb3JTcG90TGlnaHRgIGV4cGxpY2l0bHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldFNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLl9faXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNoYWRvdyBjYW1lcmEgb2Zmc2V0IGZvciBEaXJlY3Rpb25hbExpZ2h0LlxuICAgKiBUaGlzIG9mZnNldCBpcyBhcHBsaWVkIHRvIHBvc2l0aW9uIHRoZSBzaGFkb3cgY2FtZXJhIGF0IHRoZSBzY2VuZSBjZW50ZXIuXG4gICAqL1xuICBzZXQgc2hhZG93Q2FtZXJhT2Zmc2V0Rm9yRGlyZWN0aW9uYWxMaWdodCh2YWx1ZTogVmVjdG9yMykge1xuICAgIHRoaXMuX19zaGFkb3dDYW1lcmFPZmZzZXRGb3JEaXJlY3Rpb25hbExpZ2h0ID0gdmFsdWU7XG4gICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZG93IGNhbWVyYSBvZmZzZXQgZm9yIERpcmVjdGlvbmFsTGlnaHQuXG4gICAqL1xuICBnZXQgc2hhZG93Q2FtZXJhT2Zmc2V0Rm9yRGlyZWN0aW9uYWxMaWdodCgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYWRvd0NhbWVyYU9mZnNldEZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29sb3Igb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgUkdCIGNvbG9yIHZlY3RvciAodmFsdWVzIHR5cGljYWxseSAwLjAgdG8gMS4wKVxuICAgKi9cbiAgc2V0IGNvbG9yKHZhbHVlOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fX2NvbG9yID0gdmFsdWU7XG4gICAgLy8gVGhlIHNhbWUgKG11dGF0ZWQpIG9iamVjdCBtYXkgYmUgc2V0IGFnYWluLCBzbyB0aGUgdmFsdWVzIGFyZSBjb21wYXJlZCB3aXRoIHRoZSBsYXN0IHZhbHVlcy5cbiAgICBjb25zdCBsYXN0ID0gdGhpcy5fX2xhc3RDb2xvcjtcbiAgICBpZiAobGFzdFswXSAhPT0gdmFsdWUueCB8fCBsYXN0WzFdICE9PSB2YWx1ZS55IHx8IGxhc3RbMl0gIT09IHZhbHVlLnopIHtcbiAgICAgIGxhc3RbMF0gPSB2YWx1ZS54O1xuICAgICAgbGFzdFsxXSA9IHZhbHVlLnk7XG4gICAgICBsYXN0WzJdID0gdmFsdWUuejtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBSR0IgY29sb3IgdmVjdG9yXG4gICAqL1xuICBnZXQgY29sb3IoKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMuX19jb2xvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIHNoYWRvdyBkYXRhIG9mIHRoaXMgbGlnaHQgaW4gdGhlIHBlci1tYXRlcmlhbCBzaGFkb3cgYXJyYXlzXG4gICAqIChgZGVwdGhUZXh0dXJlSW5kZXhMaXN0YCBhbmQgYGRlcHRoQmlhc1BWYCksIG9yIC0xIHdoZW4gdGhlIGxpZ2h0IGhhcyBubyBzaGFkb3cgZGF0YS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQSBTaGFkb3dTeXN0ZW0gYXNzaWducyB0aGUgc2xvdHMgb2YgdGhlIGxpZ2h0cyBpdCBtYW5hZ2VzLiBPdGhlcndpc2UgdGhlIHNsb3QgaXMgdGhlIGNvbXBvbmVudCBTSURcbiAgICogd2hlbiBpdCBpcyBiZWxvdyBgQ29uZmlnLm1heExpZ2h0TnVtYmVyYCwgd2hpY2ggaXMgdGhlIGNvbnZlbnRpb24gb2YgbWFudWFsIHNoYWRvdyBtYXAgc2V0dXBzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfc2hhZG93U2xvdCgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLl9fc2hhZG93U2xvdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3NoYWRvd1Nsb3Q7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudFNJRCA8IHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyID8gdGhpcy5jb21wb25lbnRTSUQgOiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzaGFkb3cgc2xvdCBvZiB0aGlzIGxpZ2h0LiBgdW5kZWZpbmVkYCByZXN0b3JlcyB0aGUgZGVmYXVsdCBzbG90LlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHNldCBfc2hhZG93U2xvdChzbG90OiBudW1iZXIgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fc2hhZG93U2xvdCA9IHNsb3Q7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHdvcmxkIHBvc2l0aW9uIG9mIHRoZSBsaWdodCBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodFBvc2l0aW9uRm9yR3B1KCk6IE11dGFibGVWZWN0b3I0IHtcbiAgICByZXR1cm4gdGhpcy5fbGlnaHRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgd29ybGQgZGlyZWN0aW9uIG9mIHRoZSBsaWdodCBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodERpcmVjdGlvbkZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0RGlyZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaWdodCBwcm9wZXJ0eSAodHlwZSwgZWZmZWN0aXZlIHJhbmdlLCBjb3Mgb2YgdGhlIGlubmVyIGFuZCBvdXRlciBjb25lIGFuZ2xlcykgYXMgdXBsb2FkZWQgdG8gdGhlIEdQVVxuICAgKiAodXBkYXRlZCBpbiAkbG9naWMpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfbGlnaHRQcm9wZXJ0eUZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0UHJvcGVydHk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQgKGNvbG9yICogaW50ZW5zaXR5KSBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodEludGVuc2l0eUZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0SW50ZW5zaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwIHZlY3RvciBmb3IgdGhlIGxpZ2h0IGluIGxvY2FsIHNwYWNlLlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGxpZ2h0IG9yaWVudGF0aW9uIGNhbGN1bGF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVwIHZlY3RvciAoMCwgMSwgMClcbiAgICovXG4gIGdldCBfdXAoKSB7XG4gICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGxpZ2h0IGdpem1vIGluIHRoZSBlZGl0b3IuXG4gICAqIFdoZW4gZW5hYmxlZCwgY3JlYXRlcyBhbmQgc2hvd3MgYSB2aXN1YWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBzaG93IHRoZSBnaXptbywgZmFsc2UgdG8gaGlkZSBpdFxuICAgKi9cbiAgc2V0IGlzTGlnaHRHaXptb1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19saWdodEdpem1vKSkge1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ2xpZ2h0JykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19saWdodEdpem1vLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChJcy5kZWZpbmVkKHRoaXMuX19saWdodEdpem1vKSkge1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgbGlnaHQgZ2l6bW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzTGlnaHRHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmRlZmluZWQodGhpcy5fX2xpZ2h0R2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2xpZ2h0R2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGxpZ2h0IGNvbXBvbmVudCBieSBsb2FkaW5nIGdsb2JhbCBkYXRhIHJlcG9zaXRvcmllcy5cbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGxvYWRpbmcgcGhhc2UuXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICBMaWdodENvbXBvbmVudC5fX2xpZ2h0TnVtYmVyID0gdGhpcy5lbnRpdHkuZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCdsaWdodE51bWJlcicsIDApO1xuXG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGxpZ2h0IGdpem1vIGlmIGl0IGV4aXN0cyBhbmQgaXMgdmlzaWJsZS5cbiAgICogVGhpcyBpcyBjYWxsZWQgaW50ZXJuYWxseSBkdXJpbmcgdGhlIGxvZ2ljIHVwZGF0ZSBwaGFzZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVHaXptbygpIHtcbiAgICBpZiAoSXMuZGVmaW5lZCh0aGlzLl9fbGlnaHRHaXptbykgJiYgdGhpcy5fX2xpZ2h0R2l6bW8uaXNTZXR1cCAmJiB0aGlzLmlzTGlnaHRHaXptb1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19saWdodEdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29tbW9uIGxvZ2ljIHVwZGF0ZSBtZXRob2QgdGhhdCBydW5zIG9uY2UgcGVyIGZyYW1lIGZvciBhbGwgbGlnaHQgY29tcG9uZW50cy5cbiAgICogVXBkYXRlcyB0aGUgZ2xvYmFsIGxpZ2h0IGNvdW50IGZvciB0aGUgc2hhZGVyIHN5c3RlbS5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kbG9naWMoeyBlbmdpbmUgfTogeyBlbmdpbmU6IEVuZ2luZSB9KSB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKExpZ2h0Q29tcG9uZW50KSBhcyBMaWdodENvbXBvbmVudFtdO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9fbGlnaHROdW1iZXIuX3ZbMF0gPSBsaWdodENvbXBvbmVudHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGxpZ2h0IGNvbXBvbmVudCdzIHN0YXRlIGFuZCB1cGxvYWRzIGRhdGEgdG8gdGhlIEdQVS5cbiAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB0aGUgbGlnaHQgZGlyZWN0aW9uLCBwb3NpdGlvbiwgYW5kIHByb3BlcnRpZXMsXG4gICAqIHRoZW4gc3RvcmVzIHRoZW0gaW4gZ2xvYmFsIGRhdGEgYXJyYXlzIGZvciBzaGFkZXIgYWNjZXNzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBieSBjaGVja2luZyB1cGRhdGUgY291bnRzXG4gICAqIHRvIGF2b2lkIHVubmVjZXNzYXJ5IHJlY2FsY3VsYXRpb25zIHdoZW4gbm90aGluZyBoYXMgY2hhbmdlZC5cbiAgICovXG4gICRsb2dpYygpIHtcbiAgICBjb25zdCByYW5nZVNjYWxlID0gdGhpcy5fX2VuZ2luZS5jb25maWcubGlnaHRSYW5nZVNjYWxlO1xuICAgIGlmIChcbiAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSA9PT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCAmJlxuICAgICAgdGhpcy5fX2xhc3RVcGRhdGVDb3VudCA9PT0gdGhpcy5fX3VwZGF0ZUNvdW50ICYmXG4gICAgICB0aGlzLl9fbGFzdFJhbmdlU2NhbGUgPT09IHJhbmdlU2NhbGVcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY2VuZUdyYXBoQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuXG4gICAgLy8gT25seSBzcG90IGFuZCBkaXJlY3Rpb25hbCBsaWdodHMgdXNlIHRoZWlyIGRpcmVjdGlvbiBpbiB0aGUgc2hhZGVycy4gUG9pbnQgbGlnaHRzIHNraXAgdGhlIG5vcm1hbCBtYXRyaXhcbiAgICAvLyBjb21wdXRhdGlvbiwgd2hpY2ggbWF0dGVycyB3aGVuIG1hbnkgcG9pbnQgbGlnaHRzIGFyZSBhbmltYXRlZC5cbiAgICBpZiAodGhpcy50eXBlID09PSBMaWdodFR5cGUuU3BvdCB8fCB0aGlzLnR5cGUgPT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5fX2RpcmVjdGlvbiA9IHNjZW5lR3JhcGhDb21wb25lbnQubm9ybWFsTWF0cml4SW5uZXIubXVsdGlwbHlWZWN0b3IodGhpcy5fX2luaXRpYWxEaXJlY3Rpb24pO1xuICAgICAgdGhpcy5fbGlnaHREaXJlY3Rpb24uX3ZbMF0gPSB0aGlzLl9fZGlyZWN0aW9uLng7XG4gICAgICB0aGlzLl9saWdodERpcmVjdGlvbi5fdlsxXSA9IHRoaXMuX19kaXJlY3Rpb24ueTtcbiAgICAgIHRoaXMuX2xpZ2h0RGlyZWN0aW9uLl92WzJdID0gdGhpcy5fX2RpcmVjdGlvbi56O1xuICAgIH1cblxuICAgIGNvbnN0IGlubmVyQ29uZUNvcyA9IE1hdGguY29zKHRoaXMuaW5uZXJDb25lQW5nbGUpO1xuICAgIGNvbnN0IG91dGVyQ29uZUNvcyA9IE1hdGguY29zKHRoaXMub3V0ZXJDb25lQW5nbGUpO1xuXG4gICAgY29uc3QgbGlnaHRQb3NpdGlvbiA9IHNjZW5lR3JhcGhDb21wb25lbnQud29ybGRQb3NpdGlvbjtcbiAgICB0aGlzLl9saWdodFBvc2l0aW9uLl92WzBdID0gbGlnaHRQb3NpdGlvbi54O1xuICAgIHRoaXMuX2xpZ2h0UG9zaXRpb24uX3ZbMV0gPSBsaWdodFBvc2l0aW9uLnk7XG4gICAgdGhpcy5fbGlnaHRQb3NpdGlvbi5fdlsyXSA9IGxpZ2h0UG9zaXRpb24uejtcblxuICAgIGNvbnN0IGVmZmVjdGl2ZVJhbmdlID0gdGhpcy5fX2dldEVmZmVjdGl2ZVJhbmdlKCk7XG4gICAgY29uc3QgaXNSYW5nZWRMb2NhbExpZ2h0ID0gKHRoaXMudHlwZSA9PT0gTGlnaHRUeXBlLlBvaW50IHx8IHRoaXMudHlwZSA9PT0gTGlnaHRUeXBlLlNwb3QpICYmIGVmZmVjdGl2ZVJhbmdlID4gMDtcbiAgICBjb25zdCBpbnRlbnNpdHlTY2FsZSA9IGlzUmFuZ2VkTG9jYWxMaWdodCA/IExpZ2h0Q29tcG9uZW50Ll9fZ2V0SW50ZW5zaXR5U2NhbGUocmFuZ2VTY2FsZSkgOiAxO1xuICAgIGNvbnN0IGFwcGxpZWRSYW5nZVNjYWxlID0gaXNSYW5nZWRMb2NhbExpZ2h0ID8gcmFuZ2VTY2FsZSA6IDE7XG5cbiAgICB0aGlzLl9saWdodEludGVuc2l0eS5fdlswXSA9IHRoaXMuX19jb2xvci54ICogdGhpcy5fX2ludGVuc2l0eSAqIGludGVuc2l0eVNjYWxlO1xuICAgIHRoaXMuX2xpZ2h0SW50ZW5zaXR5Ll92WzFdID0gdGhpcy5fX2NvbG9yLnkgKiB0aGlzLl9faW50ZW5zaXR5ICogaW50ZW5zaXR5U2NhbGU7XG4gICAgdGhpcy5fbGlnaHRJbnRlbnNpdHkuX3ZbMl0gPSB0aGlzLl9fY29sb3IueiAqIHRoaXMuX19pbnRlbnNpdHkgKiBpbnRlbnNpdHlTY2FsZTtcblxuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMF0gPSB0aGlzLmVuYWJsZSA/IHRoaXMudHlwZS5pbmRleCA6IC0xO1xuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMV0gPSBlZmZlY3RpdmVSYW5nZSAqIGFwcGxpZWRSYW5nZVNjYWxlO1xuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMl0gPSBpbm5lckNvbmVDb3M7XG4gICAgdGhpcy5fbGlnaHRQcm9wZXJ0eS5fdlszXSA9IG91dGVyQ29uZUNvcztcblxuICAgIHRoaXMuX191cGRhdGVHaXptbygpO1xuXG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fbGFzdFVwZGF0ZUNvdW50ID0gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICAgIHRoaXMuX19sYXN0UmFuZ2VTY2FsZSA9IHJhbmdlU2NhbGU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW50ZW5zaXR5IGZhY3RvciB0aGF0IGNvbXBlbnNhdGVzIHRoZSBzaG9ydGVuZWQgcmFuZ2UuIFRoZSBmYWN0b3JzIGFyZSB0aGUgbWVhc3VyZWQgYnJpZ2h0bmVzc1xuICAgKiBiYWxhbmNlIG9mIHRoZSBTcG9uemEgc2NlbmU6IDAuOSAtPiAxLjE2IGFuZCAwLjggLT4gMS4zNS4gVmFsdWVzIGluIGJldHdlZW4gaW50ZXJwb2xhdGU7IGJlbG93IDAuOCB0aGUgbGFzdFxuICAgKiBzbG9wZSBjb250aW51ZXMuIEEgY29uc3RhbnQgZmFjdG9yIGNvbXBlbnNhdGVzIHRoZSByYW5nZSB3aW5kb3cgYXBwcm94aW1hdGVseSwgbm90IGV4YWN0bHkuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEludGVuc2l0eVNjYWxlKHJhbmdlU2NhbGU6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlU2NhbGUgPj0gMSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChyYW5nZVNjYWxlID49IDAuOSkge1xuICAgICAgcmV0dXJuIDEgKyAoMSAtIHJhbmdlU2NhbGUpICogMS42O1xuICAgIH1cbiAgICBpZiAocmFuZ2VTY2FsZSA+PSAwLjgpIHtcbiAgICAgIHJldHVybiAxLjE2ICsgKDAuOSAtIHJhbmdlU2NhbGUpICogMS45O1xuICAgIH1cbiAgICByZXR1cm4gMS4zNSArICgwLjggLSByYW5nZVNjYWxlKSAqIDEuOTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByYW5nZSB1c2VkIGZvciBzaGFkaW5nLiBQb2ludCBhbmQgc3BvdCBsaWdodHMgd2l0aG91dCBhIHJhbmdlIGdldCBhbiBhdXRvbWF0aWMgcmFuZ2VcbiAgICogd2hlbiBgQ29uZmlnLmxpZ2h0QXV0b1JhbmdlVGhyZXNob2xkYCBpcyBncmVhdGVyIHRoYW4gMC5cbiAgICovXG4gIHByaXZhdGUgX19nZXRFZmZlY3RpdmVSYW5nZSgpIHtcbiAgICBjb25zdCB0aHJlc2hvbGQgPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5saWdodEF1dG9SYW5nZVRocmVzaG9sZDtcbiAgICBpZiAodGhpcy5fX3JhbmdlID4gMCB8fCAhKHRocmVzaG9sZCA+IDApIHx8ICh0aGlzLnR5cGUgIT09IExpZ2h0VHlwZS5Qb2ludCAmJiB0aGlzLnR5cGUgIT09IExpZ2h0VHlwZS5TcG90KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yYW5nZTtcbiAgICB9XG4gICAgLy8gVGhlIGRpc3RhbmNlIHdoZXJlIChjb2xvciAqIGludGVuc2l0eSkgLyBkaXN0YW5jZV4yIGZhbGxzIHRvIHRoZSB0aHJlc2hvbGQuXG4gICAgLy8gQSBsaWdodCB3aXRob3V0IGludGVuc2l0eSBnZXRzIGEgdGlueSBwb3NpdGl2ZSByYW5nZSBzbyB0aGF0IGl0IGlzIGN1bGxlZCBpbnN0ZWFkIG9mIGJlaW5nIHVubGltaXRlZC5cbiAgICBjb25zdCBtYXhJbnRlbnNpdHkgPSBNYXRoLm1heCh0aGlzLl9fY29sb3IueCwgdGhpcy5fX2NvbG9yLnksIHRoaXMuX19jb2xvci56KSAqIHRoaXMuX19pbnRlbnNpdHk7XG4gICAgcmV0dXJuIE1hdGgubWF4KE1hdGguc3FydChNYXRoLm1heChtYXhJbnRlbnNpdHksIDApIC8gdGhyZXNob2xkKSwgMWUtNik7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBsaWdodCBjb21wb25lbnQgd2hlbiBpdCdzIGJlaW5nIGRlc3Ryb3llZC5cbiAgICogUmVzZXRzIHRoZSBsaWdodCBpbnRlbnNpdHkgdmFsdWVzIGluIHRoZSBnbG9iYWwgZGF0YSBhcnJheXMuXG4gICAqXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgX2Rlc3Ryb3koKSB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICBMaWdodENvbXBvbmVudC5fX2luY3JlbWVudFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudGl0eSB0aGF0IG93bnMgdGhpcyBsaWdodCBjb21wb25lbnQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaWdodCBlbnRpdHkgaW5zdGFuY2Ugd2l0aCBsaWdodC1zcGVjaWZpYyBtZXRob2RzXG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElMaWdodEVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCkgYXMgdW5rbm93biBhcyBJTGlnaHRFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBsaWdodC1zcGVjaWZpYyBtZXRob2RzIHRvIGFuIGVudGl0eSBjbGFzcyB0aHJvdWdoIG1peGluIGNvbXBvc2l0aW9uLlxuICAgKiBUaGlzIG1ldGhvZCBleHRlbmRzIHRoZSBiYXNlIGVudGl0eSB3aXRoIGxpZ2h0IGNvbXBvbmVudCBmdW5jdGlvbmFsaXR5LlxuICAgKlxuICAgKiBAdGVtcGxhdGUgRW50aXR5QmFzZSAtIFRoZSBiYXNlIGVudGl0eSB0eXBlXG4gICAqIEB0ZW1wbGF0ZSBTb21lQ29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHR5cGVcbiAgICogQHBhcmFtIGJhc2UgLSBUaGUgYmFzZSBlbnRpdHkgaW5zdGFuY2UgdG8gZXh0ZW5kXG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzICh1bnVzZWQgYnV0IHJlcXVpcmVkIGZvciB0eXBlIGNvbXBhdGliaWxpdHkpXG4gICAqIEByZXR1cm5zIFRoZSBleHRlbmRlZCBlbnRpdHkgd2l0aCBsaWdodCBjb21wb25lbnQgbWV0aG9kc1xuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIExpZ2h0RW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICBnZXRMaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50QnlDb21wb25lbnRUSUQoV2VsbEtub3duQ29tcG9uZW50VElEcy5MaWdodENvbXBvbmVudFRJRCkgYXMgTGlnaHRDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIExpZ2h0RW50aXR5KTtcbiAgICByZXR1cm4gYmFzZSBhcyB1bmtub3duIGFzIENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kczxTb21lQ29tcG9uZW50Q2xhc3M+ICYgRW50aXR5QmFzZTtcbiAgfVxufVxuTGlnaHRDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdsaWdodFBvc2l0aW9uJyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVZlY3RvcjMsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFswLCAwLCAwXSxcbn0pO1xuTGlnaHRDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdsaWdodERpcmVjdGlvbicsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3IzLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMCwgMCwgMF0sXG59KTtcbkxpZ2h0Q29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnbGlnaHRJbnRlbnNpdHknLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yMyxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzAsIDAsIDBdLFxufSk7XG5MaWdodENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ2xpZ2h0UHJvcGVydHknLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yNCxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNCxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWy0xLCAwLCAwLCAwXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsaUJBQWlCO0FBRTFCLFNBQVMsbUJBQTBDO0FBQ25ELFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsaUJBQXFDO0FBQzlDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsc0JBQXNCO0FBRy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsY0FBYztBQUN2QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxVQUFVO0FBR25CLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBUWhDLElBQU0sa0JBQU4sTUFBTSx3QkFBdUIsVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBNEM1QyxZQUNFLFFBQ0EsV0FDQSxjQUNBLGtCQUNBLFNBQ0E7QUFDQSxVQUFNLFFBQVEsV0FBVyxjQUFjLGtCQUFrQixPQUFPO0FBbERsRSxTQUFRLFNBQVMsVUFBVTtBQUMzQixT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
