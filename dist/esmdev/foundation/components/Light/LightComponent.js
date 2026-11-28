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
    this.Gc = LightType.Point;
    this.td = Vector3.fromCopyArray([1, 1, 1]);
    /** The components of the color at the last change, to detect changes of a mutated color object. */
    this.Md = [1, 1, 1];
    this.ud = 1;
    this.Nd = Vector3.fromCopyArray([0, 0, -1]);
    this.vd = Vector3.fromCopyArray([0, 0, -1]);
    this.Ad = 0;
    this.Bd = Math.PI / 4;
    // in radian
    this.wd = -1;
    this.Cd = true;
    this.Dd = 10;
    this.Ed = 0.1;
    this.xd = 0.1;
    this.yd = true;
    this.Fd = -1;
    this.Id = Vector3.zero();
    this.castShadow = false;
    this._lightPosition = MutableVector4.dummy();
    this._lightDirection = MutableVector4.dummy();
    this._lightIntensity = MutableVector4.dummy();
    this._lightProperty = MutableVector4.dummy();
    /** The shadow slot assigned by a ShadowSystem. `undefined` means the default slot (see `_shadowSlot`). */
    this.Gd = void 0;
    this.ia = 0;
    this.Kc = -1;
    this.Kd = -1;
    this.Ld = -1;
    this.submitToAllocation(engine.config.lightComponentCountPerBufferView, isReUse);
    _LightComponent.Hd(engine);
    engine._requestLightClusterSystem();
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
    return (_a = this.zd.get(engine)) != null ? _a : 0;
  }
  static Hd(engine) {
    var _a;
    this.zd.set(engine, ((_a = this.zd.get(engine)) != null ? _a : 0) + 1);
  }
  /**
   * Cleans up the static data of the engine.
   * @internal
   */
  static _cleanupForEngine(engine) {
    this.zd.delete(engine);
  }
  /**
   * Records a change of a property, so that the light data is recomputed and uploaded.
   */
  rd() {
    this.ia++;
    _LightComponent.Hd(this.c);
  }
  /**
   * Gets the type of the light.
   */
  get type() {
    return this.Gc;
  }
  /**
   * Sets the type of the light.
   */
  set type(value) {
    if (this.Gc !== value) {
      this.Gc = value;
      this.rd();
    }
  }
  /**
   * Gets whether the light is enabled.
   */
  get enable() {
    return this.Cd;
  }
  /**
   * Sets whether the light is enabled. A disabled light does not light anything.
   */
  set enable(value) {
    if (this.Cd !== value) {
      this.Cd = value;
      this.rd();
    }
  }
  /**
   * Gets the inner cone angle of the spot light (in radian).
   */
  get innerConeAngle() {
    return this.Ad;
  }
  /**
   * Sets the inner cone angle of the spot light (in radian).
   */
  set innerConeAngle(value) {
    if (this.Ad !== value) {
      this.Ad = value;
      this.rd();
    }
  }
  /**
   * Gets the outer cone angle of the spot light (in radian).
   */
  get outerConeAngle() {
    return this.Bd;
  }
  /**
   * Sets the outer cone angle of the spot light (in radian).
   */
  set outerConeAngle(value) {
    if (this.Bd !== value) {
      this.Bd = value;
      this.rd();
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
    return this.ia;
  }
  /**
   * Gets the current direction vector of the light.
   * This direction is calculated based on the transform component's rotation.
   *
   * @returns The normalized direction vector
   */
  get direction() {
    return this.vd;
  }
  /**
   * Sets the intensity of the light.
   *
   * @param value - The intensity value (typically 0.0 to 1.0, but can be higher for HDR)
   */
  set intensity(value) {
    if (this.ud !== value) {
      this.ud = value;
      this.rd();
    }
  }
  /**
   * Gets the intensity of the light.
   *
   * @returns The current intensity value
   */
  get intensity() {
    return this.ud;
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
    if (this.wd !== value) {
      this.wd = value;
      this.rd();
    }
  }
  /**
   * Gets the effective range of the light.
   */
  get range() {
    return this.wd;
  }
  /**
   * Sets the orthographic half-size used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set orthographic extents.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowAreaSizeForDirectionalLight(value) {
    if (this.Dd !== value) {
      this.Dd = value;
      this.rd();
    }
  }
  /**
   * Gets the orthographic half-size used for DirectionalLight shadow camera.
   */
  get shadowAreaSizeForDirectionalLight() {
    return this.Dd;
  }
  /**
   * Sets the zNear value used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set zNear.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowZNearForDirectionalLight(value) {
    if (this.Ed !== value) {
      this.Ed = value;
      this.rd();
    }
  }
  /**
   * Gets the zNear value used for DirectionalLight shadow camera.
   */
  get shadowZNearForDirectionalLight() {
    return this.Ed;
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
    if (this.xd !== value || this.yd) {
      this.xd = value;
      this.yd = false;
      this.rd();
    }
  }
  /**
   * Gets the zNear value used for SpotLight shadow camera.
   */
  get shadowZNearForSpotLight() {
    return this.xd;
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
    if (this.Fd !== value) {
      this.Fd = value;
      this.rd();
    }
  }
  /**
   * Gets the explicit far plane of the PointLight shadow map (-1: automatic).
   */
  get pointLightShadowFarPlane() {
    return this.Fd;
  }
  /**
   * Whether the SpotLight shadow camera zNear is fitted automatically from the
   * distance to the nearest shadow caster.
   */
  get isShadowZNearForSpotLightAuto() {
    return this.yd;
  }
  /**
   * Sets the automatically fitted zNear value. Does nothing when the user set
   * `shadowZNearForSpotLight` explicitly.
   * @internal
   */
  _setShadowZNearForSpotLightAuto(value) {
    if (!this.yd) {
      return;
    }
    if (this.xd !== value) {
      this.xd = value;
      this.rd();
    }
  }
  /**
   * Sets the shadow camera offset for DirectionalLight.
   * This offset is applied to position the shadow camera at the scene center.
   */
  set shadowCameraOffsetForDirectionalLight(value) {
    this.Id = value;
    this.rd();
  }
  /**
   * Gets the shadow camera offset for DirectionalLight.
   */
  get shadowCameraOffsetForDirectionalLight() {
    return this.Id;
  }
  /**
   * Sets the color of the light.
   *
   * @param value - The RGB color vector (values typically 0.0 to 1.0)
   */
  set color(value) {
    this.td = value;
    const last = this.Md;
    if (last[0] !== value.x || last[1] !== value.y || last[2] !== value.z) {
      last[0] = value.x;
      last[1] = value.y;
      last[2] = value.z;
      this.rd();
    }
  }
  /**
   * Gets the color of the light.
   *
   * @returns The RGB color vector
   */
  get color() {
    return this.td;
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
    if (this.Gd !== void 0) {
      return this.Gd;
    }
    return this.componentSID < this.c.config.maxLightNumber ? this.componentSID : -1;
  }
  /**
   * Sets the shadow slot of this light. `undefined` restores the default slot.
   *
   * @internal
   */
  set _shadowSlot(slot) {
    this.Gd = slot;
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
      if (Is.not.defined(this.sd)) {
        this.sd = new (_getGizmoClass("light"))(this.entity.engine, this.entity);
        this.sd._setup();
      }
      this.sd.isVisible = true;
    } else {
      if (Is.defined(this.sd)) {
        this.sd.isVisible = false;
      }
    }
    this.rd();
  }
  /**
   * Gets the visibility state of the light gizmo.
   *
   * @returns True if the gizmo is visible, false otherwise
   */
  get isLightGizmoVisible() {
    if (Is.defined(this.sd)) {
      return this.sd.isVisible;
    }
    return false;
  }
  /**
   * Initializes the light component by loading global data repositories.
   * This method is called during the component loading phase.
   */
  $load() {
    _LightComponent.Jd = this.entity.engine.globalDataRepository.getValue("lightNumber", 0);
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Updates the light gizmo if it exists and is visible.
   * This is called internally during the logic update phase.
   *
   * @private
   */
  Od() {
    if (Is.defined(this.sd) && this.sd.isSetup && this.isLightGizmoVisible) {
      this.sd._update();
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
    _LightComponent.Jd._v[0] = lightComponents.length;
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
    const rangeScale = this.c.config.lightRangeScale;
    if (TransformComponent.getUpdateCount(this.c) === this.Kd && this.Kc === this.ia && this.Ld === rangeScale) {
      return;
    }
    const sceneGraphComponent = this.entity.getSceneGraph();
    if (this.type === LightType.Spot || this.type === LightType.Directional) {
      this.vd = sceneGraphComponent.normalMatrixInner.multiplyVector(this.Nd);
      this._lightDirection._v[0] = this.vd.x;
      this._lightDirection._v[1] = this.vd.y;
      this._lightDirection._v[2] = this.vd.z;
    }
    const innerConeCos = Math.cos(this.innerConeAngle);
    const outerConeCos = Math.cos(this.outerConeAngle);
    const lightPosition = sceneGraphComponent.worldPosition;
    this._lightPosition._v[0] = lightPosition.x;
    this._lightPosition._v[1] = lightPosition.y;
    this._lightPosition._v[2] = lightPosition.z;
    const effectiveRange = this.Pd();
    const isRangedLocalLight = (this.type === LightType.Point || this.type === LightType.Spot) && effectiveRange > 0;
    const intensityScale = isRangedLocalLight ? _LightComponent.Qd(rangeScale) : 1;
    const appliedRangeScale = isRangedLocalLight ? rangeScale : 1;
    this._lightIntensity._v[0] = this.td.x * this.ud * intensityScale;
    this._lightIntensity._v[1] = this.td.y * this.ud * intensityScale;
    this._lightIntensity._v[2] = this.td.z * this.ud * intensityScale;
    this._lightProperty._v[0] = this.enable ? this.type.index : -1;
    this._lightProperty._v[1] = effectiveRange * appliedRangeScale;
    this._lightProperty._v[2] = innerConeCos;
    this._lightProperty._v[3] = outerConeCos;
    this.Od();
    this.Kd = TransformComponent.getUpdateCount(this.c);
    this.Kc = this.ia;
    this.Ld = rangeScale;
  }
  /**
   * Returns the intensity factor that compensates the shortened range. The factors are the measured brightness
   * balance of the Sponza scene: 0.9 -> 1.16 and 0.8 -> 1.35. Values in between interpolate; below 0.8 the last
   * slope continues. A constant factor compensates the range window approximately, not exactly.
   */
  static Qd(rangeScale) {
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
  Pd() {
    const threshold = this.c.config.lightAutoRangeThreshold;
    if (this.wd > 0 || !(threshold > 0) || this.type !== LightType.Point && this.type !== LightType.Spot) {
      return this.wd;
    }
    const maxIntensity = Math.max(this.td.x, this.td.y, this.td.z) * this.ud;
    return Math.max(Math.sqrt(Math.max(maxIntensity, 0) / threshold), 1e-6);
  }
  /**
   * Cleans up the light component when it's being destroyed.
   * Destroys the light gizmo so that it does not stay in the scene after the light
   * entity (or only its LightComponent) is removed, and resets the light intensity
   * values in the global data arrays.
   *
   * @override
   */
  _destroy() {
    var _a;
    (_a = this.sd) == null ? void 0 : _a._destroy();
    this.sd = void 0;
    super._destroy();
    _LightComponent.Hd(this.c);
  }
  /**
   * Gets the entity that owns this light component.
   *
   * @returns The light entity instance with light-specific methods
   */
  get entity() {
    return this.c.entityRepository.getEntity(this.Qb);
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
_LightComponent.Jd = Scalar.zero();
/** The number of changes of all light components, per engine. */
_LightComponent.zd = /* @__PURE__ */ new Map();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9MaWdodC9MaWdodENvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlEIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBCdWZmZXJVc2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9CdWZmZXJVc2UnO1xuaW1wb3J0IHsgQ29tcG9uZW50VHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IExpZ2h0VHlwZSwgdHlwZSBMaWdodFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgeyBTaGFkZXJUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgeyBfZ2V0R2l6bW9DbGFzcyB9IGZyb20gJy4uLy4uL2dpem1vcy9HaXptb1JlZ2lzdHJ5JztcbmltcG9ydCB0eXBlIHsgTGlnaHRHaXptbyB9IGZyb20gJy4uLy4uL2dpem1vcy9MaWdodEdpem1vJztcbmltcG9ydCB0eXBlIHsgSUxpZ2h0RW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3I0IH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yNCc7XG5pbXBvcnQgeyBTY2FsYXIgfSBmcm9tICcuLi8uLi9tYXRoL1NjYWxhcic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vLi4vbWlzYy9Jcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcblxuLyoqXG4gKiBUaGUgQ29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIGxpZ2h0LlxuICpcbiAqIEByZW1hcmtzXG4gKiB0aGUgbGlnaHQgbG9va3MgdG93YXJkcyB0aGUgbG9jYWwgLVogYXhpcyBpbiByaWdodCBoYW5kIGNvb3JkaW5hdGUgc3lzdGVtLlxuICovXG5leHBvcnQgY2xhc3MgTGlnaHRDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIF9fdHlwZSA9IExpZ2h0VHlwZS5Qb2ludDtcbiAgcHJpdmF0ZSBfX2NvbG9yID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFsxLCAxLCAxXSk7XG4gIC8qKiBUaGUgY29tcG9uZW50cyBvZiB0aGUgY29sb3IgYXQgdGhlIGxhc3QgY2hhbmdlLCB0byBkZXRlY3QgY2hhbmdlcyBvZiBhIG11dGF0ZWQgY29sb3Igb2JqZWN0LiAqL1xuICBwcml2YXRlIF9fbGFzdENvbG9yID0gWzEsIDEsIDFdO1xuICBwcml2YXRlIF9faW50ZW5zaXR5ID0gMTtcbiAgcHJpdmF0ZSByZWFkb25seSBfX2luaXRpYWxEaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIC0xXSk7XG4gIHByaXZhdGUgX19kaXJlY3Rpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIC0xXSk7XG4gIHByaXZhdGUgX19pbm5lckNvbmVBbmdsZSA9IDAuMDtcbiAgcHJpdmF0ZSBfX291dGVyQ29uZUFuZ2xlID0gTWF0aC5QSSAvIDQuMDsgLy8gaW4gcmFkaWFuXG4gIHByaXZhdGUgX19yYW5nZSA9IC0xO1xuICBwcml2YXRlIF9fZW5hYmxlID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfX3NoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCA9IDEwO1xuICBwcml2YXRlIF9fc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0ID0gMC4xO1xuICBwcml2YXRlIF9fc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSAwLjE7XG4gIHByaXZhdGUgX19pc1NoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byA9IHRydWU7XG4gIHByaXZhdGUgX19wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUgPSAtMTtcbiAgcHJpdmF0ZSBfX3NoYWRvd0NhbWVyYU9mZnNldEZvckRpcmVjdGlvbmFsTGlnaHQgPSBWZWN0b3IzLnplcm8oKTtcbiAgcHVibGljIGNhc3RTaGFkb3cgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfbGlnaHRQb3NpdGlvbiA9IE11dGFibGVWZWN0b3I0LmR1bW15KCk7XG4gIHByaXZhdGUgX2xpZ2h0RGlyZWN0aW9uID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfbGlnaHRJbnRlbnNpdHkgPSBNdXRhYmxlVmVjdG9yNC5kdW1teSgpO1xuICBwcml2YXRlIF9saWdodFByb3BlcnR5ID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19saWdodE51bWJlciA9IFNjYWxhci56ZXJvKCk7XG4gIHByaXZhdGUgX19saWdodEdpem1vPzogTGlnaHRHaXptbztcbiAgLyoqIFRoZSBzaGFkb3cgc2xvdCBhc3NpZ25lZCBieSBhIFNoYWRvd1N5c3RlbS4gYHVuZGVmaW5lZGAgbWVhbnMgdGhlIGRlZmF1bHQgc2xvdCAoc2VlIGBfc2hhZG93U2xvdGApLiAqL1xuICBwcml2YXRlIF9fc2hhZG93U2xvdDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIHByaXZhdGUgX191cGRhdGVDb3VudCA9IDA7XG4gIHByaXZhdGUgX19sYXN0VXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFJhbmdlU2NhbGUgPSAtMTtcbiAgLyoqIFRoZSBudW1iZXIgb2YgY2hhbmdlcyBvZiBhbGwgbGlnaHQgY29tcG9uZW50cywgcGVyIGVuZ2luZS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX191cGRhdGVDb3VudE1hcDogTWFwPEVuZ2luZSwgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBMaWdodENvbXBvbmVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRoaXMgY29tcG9uZW50IGJlbG9uZ3MgdG9cbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBjb21wb25lbnQgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgZW50aXR5IHJlcG9zaXRvcnkgaW5zdGFuY2VcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCBmcm9tIGEgcG9vbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuXG4gICAgdGhpcy5zdWJtaXRUb0FsbG9jYXRpb24oZW5naW5lLmNvbmZpZy5saWdodENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldywgaXNSZVVzZSk7XG4gICAgTGlnaHRDb21wb25lbnQuX19pbmNyZW1lbnRVcGRhdGVDb3VudChlbmdpbmUpO1xuICAgIC8vIFRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbSBpcyBuZWVkZWQgb25seSB3aGVuIHRoZSBzY2VuZSBoYXMgbGlnaHRzOyBsb2FkIGl0IGJlZm9yZSB0aGUgcmVuZGVyIGxvb3Agc3RhcnRzLlxuICAgIGVuZ2luZS5fcmVxdWVzdExpZ2h0Q2x1c3RlclN5c3RlbSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBjaGFuZ2VzIG9mIGFsbCBsaWdodCBjb21wb25lbnRzIG9mIHRoZSBlbmdpbmUgKGNyZWF0aW9uLCBkZXN0cnVjdGlvbiBhbmQgcHJvcGVydHkgY2hhbmdlcykuXG4gICAqIFRoZSBlbmdpbmUgYW5kIHRoZSByZW5kZXJpbmcgc3RyYXRlZ2llcyB1c2UgaXQgdG8gcHJvY2VzcyBhbmQgdXBsb2FkIHRoZSBsaWdodCBkYXRhIG9ubHkgd2hlbiBpdCBjaGFuZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlIGNvdW50XG4gICAqL1xuICBzdGF0aWMgZ2V0VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9faW5jcmVtZW50VXBkYXRlQ291bnQoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnRNYXAuc2V0KGVuZ2luZSwgKHRoaXMuX191cGRhdGVDb3VudE1hcC5nZXQoZW5naW5lKSA/PyAwKSArIDEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgc3RhdGljIGRhdGEgb2YgdGhlIGVuZ2luZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnRNYXAuZGVsZXRlKGVuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkcyBhIGNoYW5nZSBvZiBhIHByb3BlcnR5LCBzbyB0aGF0IHRoZSBsaWdodCBkYXRhIGlzIHJlY29tcHV0ZWQgYW5kIHVwbG9hZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX21hcmtVcGRhdGVkKCkge1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdHlwZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBnZXQgdHlwZSgpOiBMaWdodFR5cGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHlwZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBzZXQgdHlwZSh2YWx1ZTogTGlnaHRUeXBlRW51bSkge1xuICAgIGlmICh0aGlzLl9fdHlwZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX190eXBlID0gdmFsdWU7XG4gICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIHRoZSBsaWdodCBpcyBlbmFibGVkLlxuICAgKi9cbiAgZ2V0IGVuYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2VuYWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHdoZXRoZXIgdGhlIGxpZ2h0IGlzIGVuYWJsZWQuIEEgZGlzYWJsZWQgbGlnaHQgZG9lcyBub3QgbGlnaHQgYW55dGhpbmcuXG4gICAqL1xuICBzZXQgZW5hYmxlKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuX19lbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl9fZW5hYmxlID0gdmFsdWU7XG4gICAgICB0aGlzLl9fbWFya1VwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5uZXIgY29uZSBhbmdsZSBvZiB0aGUgc3BvdCBsaWdodCAoaW4gcmFkaWFuKS5cbiAgICovXG4gIGdldCBpbm5lckNvbmVBbmdsZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9faW5uZXJDb25lQW5nbGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5uZXIgY29uZSBhbmdsZSBvZiB0aGUgc3BvdCBsaWdodCAoaW4gcmFkaWFuKS5cbiAgICovXG4gIHNldCBpbm5lckNvbmVBbmdsZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19pbm5lckNvbmVBbmdsZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19pbm5lckNvbmVBbmdsZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG91dGVyIGNvbmUgYW5nbGUgb2YgdGhlIHNwb3QgbGlnaHQgKGluIHJhZGlhbikuXG4gICAqL1xuICBnZXQgb3V0ZXJDb25lQW5nbGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX291dGVyQ29uZUFuZ2xlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG91dGVyIGNvbmUgYW5nbGUgb2YgdGhlIHNwb3QgbGlnaHQgKGluIHJhZGlhbikuXG4gICAqL1xuICBzZXQgb3V0ZXJDb25lQW5nbGUodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fb3V0ZXJDb25lQW5nbGUgIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl9fb3V0ZXJDb25lQW5nbGUgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBMaWdodENvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLkxpZ2h0Q29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTGlnaHRDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB1cGRhdGUgY291bnQgb2YgdGhpcyBsaWdodCBjb21wb25lbnQuXG4gICAqIFRoZSB1cGRhdGUgY291bnQgaXMgaW5jcmVtZW50ZWQgd2hlbmV2ZXIgdGhlIGxpZ2h0IHByb3BlcnRpZXMgY2hhbmdlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB1cGRhdGUgY291bnRcbiAgICovXG4gIGdldCB1cGRhdGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgZGlyZWN0aW9uIHZlY3RvciBvZiB0aGUgbGlnaHQuXG4gICAqIFRoaXMgZGlyZWN0aW9uIGlzIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIHRyYW5zZm9ybSBjb21wb25lbnQncyByb3RhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5vcm1hbGl6ZWQgZGlyZWN0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGRpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2RpcmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlbnNpdHkgb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZW5zaXR5IHZhbHVlICh0eXBpY2FsbHkgMC4wIHRvIDEuMCwgYnV0IGNhbiBiZSBoaWdoZXIgZm9yIEhEUilcbiAgICovXG4gIHNldCBpbnRlbnNpdHkodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9faW50ZW5zaXR5ICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX2ludGVuc2l0eSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGludGVuc2l0eSB2YWx1ZVxuICAgKi9cbiAgZ2V0IGludGVuc2l0eSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9faW50ZW5zaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGVmZmVjdGl2ZSByYW5nZSBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgdmFsdWUgaXMgdXNlZCBmb3I6XG4gICAqIC0gU3BvdExpZ2h0IHNoYWRvdyBjYW1lcmEgekZhciAod2hlbiBzaGFkb3cgbWFwcGluZyBpcyBlbmFibGVkKVxuICAgKiAtIERpcmVjdGlvbmFsTGlnaHQgc2hhZG93IGNhbWVyYSB6RmFyIGZhbGxiYWNrICh3aGVuIHJhbmdlICE9PSAtMSlcbiAgICogLSBTaGFkaW5nIGF0dGVudWF0aW9uIC8gbGlnaHQgcHJvcGVydHkgdW5pZm9ybXNcbiAgICpcbiAgICogVXBkYXRpbmcgdGhpcyBwcm9wZXJ0eSBpbmNyZW1lbnRzIHVwZGF0ZUNvdW50IHNvIGRlcGVuZGVudCBzeXN0ZW1zIGNhbiByZWFjdC5cbiAgICovXG4gIHNldCByYW5nZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19yYW5nZSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19yYW5nZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVmZmVjdGl2ZSByYW5nZSBvZiB0aGUgbGlnaHQuXG4gICAqL1xuICBnZXQgcmFuZ2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3JhbmdlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG9ydGhvZ3JhcGhpYyBoYWxmLXNpemUgdXNlZCBmb3IgRGlyZWN0aW9uYWxMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBDYW1lcmFDb21wb25lbnQgc3luY3MgdG8gbGlnaHQgZWFjaCBmcmFtZSBhbmQgdXNlcyB0aGlzIHRvIHNldCBvcnRob2dyYXBoaWMgZXh0ZW50cy5cbiAgICogVXBkYXRpbmcgdGhpcyBwcm9wZXJ0eSBpbmNyZW1lbnRzIHVwZGF0ZUNvdW50IHNvIGNhbWVyYSBzeW5jIGlzIHJlZnJlc2hlZC5cbiAgICovXG4gIHNldCBzaGFkb3dBcmVhU2l6ZUZvckRpcmVjdGlvbmFsTGlnaHQodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fc2hhZG93QXJlYVNpemVGb3JEaXJlY3Rpb25hbExpZ2h0ICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX3NoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG9ydGhvZ3JhcGhpYyBoYWxmLXNpemUgdXNlZCBmb3IgRGlyZWN0aW9uYWxMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKi9cbiAgZ2V0IHNoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZG93QXJlYVNpemVGb3JEaXJlY3Rpb25hbExpZ2h0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHpOZWFyIHZhbHVlIHVzZWQgZm9yIERpcmVjdGlvbmFsTGlnaHQgc2hhZG93IGNhbWVyYS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQ2FtZXJhQ29tcG9uZW50IHN5bmNzIHRvIGxpZ2h0IGVhY2ggZnJhbWUgYW5kIHVzZXMgdGhpcyB0byBzZXQgek5lYXIuXG4gICAqIFVwZGF0aW5nIHRoaXMgcHJvcGVydHkgaW5jcmVtZW50cyB1cGRhdGVDb3VudCBzbyBjYW1lcmEgc3luYyBpcyByZWZyZXNoZWQuXG4gICAqL1xuICBzZXQgc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0KHZhbHVlOiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5fX3NoYWRvd1pOZWFyRm9yRGlyZWN0aW9uYWxMaWdodCAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19zaGFkb3daTmVhckZvckRpcmVjdGlvbmFsTGlnaHQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB6TmVhciB2YWx1ZSB1c2VkIGZvciBEaXJlY3Rpb25hbExpZ2h0IHNoYWRvdyBjYW1lcmEuXG4gICAqL1xuICBnZXQgc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkb3daTmVhckZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgek5lYXIgdmFsdWUgb2YgdGhlIFNwb3RMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIGxhcmdlciB6TmVhciBtYWtlcyB0aGUgcGVyc3BlY3RpdmUgZGVwdGggb2YgdGhlIHNoYWRvdyBtYXAgbW9yZSBsaW5lYXIsIHdoaWNoXG4gICAqIGltcHJvdmVzIHRoZSBjb250cmFzdCBvZiB2YXJpYW5jZSBzaGFkb3cgbWFwcy4gSXQgbXVzdCBzdGF5IGJlbG93IHRoZSBkaXN0YW5jZVxuICAgKiBmcm9tIHRoZSBsaWdodCB0byB0aGUgbmVhcmVzdCBzaGFkb3cgY2FzdGVyLCBvciB0aGF0IGNhc3RlciBpcyBjbGlwcGVkLlxuICAgKiBTZXR0aW5nIHRoaXMgcHJvcGVydHkgZGlzYWJsZXMgdGhlIGF1dG9tYXRpYyBmaXR0aW5nIG9mIGBTaGFkb3dTeXN0ZW1gXG4gICAqIChgaXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG9gIGJlY29tZXMgZmFsc2UpLlxuICAgKiBVcGRhdGluZyB0aGlzIHByb3BlcnR5IGluY3JlbWVudHMgdXBkYXRlQ291bnQgc28gdGhlIGNhbWVyYSBzeW5jIGlzIHJlZnJlc2hlZC5cbiAgICovXG4gIHNldCBzaGFkb3daTmVhckZvclNwb3RMaWdodCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCAhPT0gdmFsdWUgfHwgdGhpcy5fX2lzU2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKSB7XG4gICAgICB0aGlzLl9fc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQgPSB2YWx1ZTtcbiAgICAgIHRoaXMuX19pc1NoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byA9IGZhbHNlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHpOZWFyIHZhbHVlIHVzZWQgZm9yIFNwb3RMaWdodCBzaGFkb3cgY2FtZXJhLlxuICAgKi9cbiAgZ2V0IHNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmYXIgcGxhbmUgb2YgdGhlIHBhcmFib2xvaWQgc2hhZG93IG1hcCBvZiB0aGlzIFBvaW50TGlnaHQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBmYXIgcGxhbmUgbm9ybWFsaXplcyB0aGUgc3RvcmVkIGRlcHRoLiBBIHNtYWxsZXIgdmFsdWUga2VlcHMgdGhlIGJsdXJyZWRcbiAgICogYmFja2dyb3VuZCBvdXQgb2YgdGhlIHNoYWRvdyBtb21lbnRzLCBidXQgcmVjZWl2ZXJzIGZhcnRoZXIgdGhhbiB0aGUgZmFyIHBsYW5lXG4gICAqIGNhbm5vdCBiZSBzaGFkZWQgY29ycmVjdGx5LiAtMSAodGhlIGRlZmF1bHQpIGZpdHMgaXQgYXV0b21hdGljYWxseTogdGhlIGxpZ2h0J3NcbiAgICogZWZmZWN0aXZlIHJhbmdlIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgdGhlIGZhcnRoZXN0IHNoYWRvdyByZWNlaXZlciBpbiB0aGUgc2NlbmUuXG4gICAqIFVwZGF0aW5nIHRoaXMgcHJvcGVydHkgaW5jcmVtZW50cyB1cGRhdGVDb3VudC5cbiAgICovXG4gIHNldCBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmUodmFsdWU6IG51bWJlcikge1xuICAgIGlmICh0aGlzLl9fcG9pbnRMaWdodFNoYWRvd0ZhclBsYW5lICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fX3BvaW50TGlnaHRTaGFkb3dGYXJQbGFuZSA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV4cGxpY2l0IGZhciBwbGFuZSBvZiB0aGUgUG9pbnRMaWdodCBzaGFkb3cgbWFwICgtMTogYXV0b21hdGljKS5cbiAgICovXG4gIGdldCBwb2ludExpZ2h0U2hhZG93RmFyUGxhbmUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3BvaW50TGlnaHRTaGFkb3dGYXJQbGFuZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBTcG90TGlnaHQgc2hhZG93IGNhbWVyYSB6TmVhciBpcyBmaXR0ZWQgYXV0b21hdGljYWxseSBmcm9tIHRoZVxuICAgKiBkaXN0YW5jZSB0byB0aGUgbmVhcmVzdCBzaGFkb3cgY2FzdGVyLlxuICAgKi9cbiAgZ2V0IGlzU2hhZG93Wk5lYXJGb3JTcG90TGlnaHRBdXRvKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG87XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXV0b21hdGljYWxseSBmaXR0ZWQgek5lYXIgdmFsdWUuIERvZXMgbm90aGluZyB3aGVuIHRoZSB1c2VyIHNldFxuICAgKiBgc2hhZG93Wk5lYXJGb3JTcG90TGlnaHRgIGV4cGxpY2l0bHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldFNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0QXV0byh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLl9faXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX19zaGFkb3daTmVhckZvclNwb3RMaWdodCA9IHZhbHVlO1xuICAgICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHNoYWRvdyBjYW1lcmEgb2Zmc2V0IGZvciBEaXJlY3Rpb25hbExpZ2h0LlxuICAgKiBUaGlzIG9mZnNldCBpcyBhcHBsaWVkIHRvIHBvc2l0aW9uIHRoZSBzaGFkb3cgY2FtZXJhIGF0IHRoZSBzY2VuZSBjZW50ZXIuXG4gICAqL1xuICBzZXQgc2hhZG93Q2FtZXJhT2Zmc2V0Rm9yRGlyZWN0aW9uYWxMaWdodCh2YWx1ZTogVmVjdG9yMykge1xuICAgIHRoaXMuX19zaGFkb3dDYW1lcmFPZmZzZXRGb3JEaXJlY3Rpb25hbExpZ2h0ID0gdmFsdWU7XG4gICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZG93IGNhbWVyYSBvZmZzZXQgZm9yIERpcmVjdGlvbmFsTGlnaHQuXG4gICAqL1xuICBnZXQgc2hhZG93Q2FtZXJhT2Zmc2V0Rm9yRGlyZWN0aW9uYWxMaWdodCgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYWRvd0NhbWVyYU9mZnNldEZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29sb3Igb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgUkdCIGNvbG9yIHZlY3RvciAodmFsdWVzIHR5cGljYWxseSAwLjAgdG8gMS4wKVxuICAgKi9cbiAgc2V0IGNvbG9yKHZhbHVlOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fX2NvbG9yID0gdmFsdWU7XG4gICAgLy8gVGhlIHNhbWUgKG11dGF0ZWQpIG9iamVjdCBtYXkgYmUgc2V0IGFnYWluLCBzbyB0aGUgdmFsdWVzIGFyZSBjb21wYXJlZCB3aXRoIHRoZSBsYXN0IHZhbHVlcy5cbiAgICBjb25zdCBsYXN0ID0gdGhpcy5fX2xhc3RDb2xvcjtcbiAgICBpZiAobGFzdFswXSAhPT0gdmFsdWUueCB8fCBsYXN0WzFdICE9PSB2YWx1ZS55IHx8IGxhc3RbMl0gIT09IHZhbHVlLnopIHtcbiAgICAgIGxhc3RbMF0gPSB2YWx1ZS54O1xuICAgICAgbGFzdFsxXSA9IHZhbHVlLnk7XG4gICAgICBsYXN0WzJdID0gdmFsdWUuejtcbiAgICAgIHRoaXMuX19tYXJrVXBkYXRlZCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb2xvciBvZiB0aGUgbGlnaHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBSR0IgY29sb3IgdmVjdG9yXG4gICAqL1xuICBnZXQgY29sb3IoKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMuX19jb2xvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIHNoYWRvdyBkYXRhIG9mIHRoaXMgbGlnaHQgaW4gdGhlIHBlci1tYXRlcmlhbCBzaGFkb3cgYXJyYXlzXG4gICAqIChgZGVwdGhUZXh0dXJlSW5kZXhMaXN0YCBhbmQgYGRlcHRoQmlhc1BWYCksIG9yIC0xIHdoZW4gdGhlIGxpZ2h0IGhhcyBubyBzaGFkb3cgZGF0YS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQSBTaGFkb3dTeXN0ZW0gYXNzaWducyB0aGUgc2xvdHMgb2YgdGhlIGxpZ2h0cyBpdCBtYW5hZ2VzLiBPdGhlcndpc2UgdGhlIHNsb3QgaXMgdGhlIGNvbXBvbmVudCBTSURcbiAgICogd2hlbiBpdCBpcyBiZWxvdyBgQ29uZmlnLm1heExpZ2h0TnVtYmVyYCwgd2hpY2ggaXMgdGhlIGNvbnZlbnRpb24gb2YgbWFudWFsIHNoYWRvdyBtYXAgc2V0dXBzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfc2hhZG93U2xvdCgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLl9fc2hhZG93U2xvdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3NoYWRvd1Nsb3Q7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudFNJRCA8IHRoaXMuX19lbmdpbmUuY29uZmlnLm1heExpZ2h0TnVtYmVyID8gdGhpcy5jb21wb25lbnRTSUQgOiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzaGFkb3cgc2xvdCBvZiB0aGlzIGxpZ2h0LiBgdW5kZWZpbmVkYCByZXN0b3JlcyB0aGUgZGVmYXVsdCBzbG90LlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHNldCBfc2hhZG93U2xvdChzbG90OiBudW1iZXIgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fc2hhZG93U2xvdCA9IHNsb3Q7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHdvcmxkIHBvc2l0aW9uIG9mIHRoZSBsaWdodCBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodFBvc2l0aW9uRm9yR3B1KCk6IE11dGFibGVWZWN0b3I0IHtcbiAgICByZXR1cm4gdGhpcy5fbGlnaHRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgd29ybGQgZGlyZWN0aW9uIG9mIHRoZSBsaWdodCBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodERpcmVjdGlvbkZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0RGlyZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaWdodCBwcm9wZXJ0eSAodHlwZSwgZWZmZWN0aXZlIHJhbmdlLCBjb3Mgb2YgdGhlIGlubmVyIGFuZCBvdXRlciBjb25lIGFuZ2xlcykgYXMgdXBsb2FkZWQgdG8gdGhlIEdQVVxuICAgKiAodXBkYXRlZCBpbiAkbG9naWMpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfbGlnaHRQcm9wZXJ0eUZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0UHJvcGVydHk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGludGVuc2l0eSBvZiB0aGUgbGlnaHQgKGNvbG9yICogaW50ZW5zaXR5KSBhcyB1cGxvYWRlZCB0byB0aGUgR1BVICh1cGRhdGVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodEludGVuc2l0eUZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0SW50ZW5zaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwIHZlY3RvciBmb3IgdGhlIGxpZ2h0IGluIGxvY2FsIHNwYWNlLlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGxpZ2h0IG9yaWVudGF0aW9uIGNhbGN1bGF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVwIHZlY3RvciAoMCwgMSwgMClcbiAgICovXG4gIGdldCBfdXAoKSB7XG4gICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGxpZ2h0IGdpem1vIGluIHRoZSBlZGl0b3IuXG4gICAqIFdoZW4gZW5hYmxlZCwgY3JlYXRlcyBhbmQgc2hvd3MgYSB2aXN1YWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIGxpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0gZmxnIC0gVHJ1ZSB0byBzaG93IHRoZSBnaXptbywgZmFsc2UgdG8gaGlkZSBpdFxuICAgKi9cbiAgc2V0IGlzTGlnaHRHaXptb1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgaWYgKGZsZykge1xuICAgICAgaWYgKElzLm5vdC5kZWZpbmVkKHRoaXMuX19saWdodEdpem1vKSkge1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ2xpZ2h0JykpKHRoaXMuZW50aXR5LmVuZ2luZSwgdGhpcy5lbnRpdHkpO1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptby5fc2V0dXAoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19saWdodEdpem1vLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChJcy5kZWZpbmVkKHRoaXMuX19saWdodEdpem1vKSkge1xuICAgICAgICB0aGlzLl9fbGlnaHRHaXptby5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX21hcmtVcGRhdGVkKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgbGlnaHQgZ2l6bW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzTGlnaHRHaXptb1Zpc2libGUoKSB7XG4gICAgaWYgKElzLmRlZmluZWQodGhpcy5fX2xpZ2h0R2l6bW8pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2xpZ2h0R2l6bW8uaXNWaXNpYmxlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGxpZ2h0IGNvbXBvbmVudCBieSBsb2FkaW5nIGdsb2JhbCBkYXRhIHJlcG9zaXRvcmllcy5cbiAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGR1cmluZyB0aGUgY29tcG9uZW50IGxvYWRpbmcgcGhhc2UuXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICBMaWdodENvbXBvbmVudC5fX2xpZ2h0TnVtYmVyID0gdGhpcy5lbnRpdHkuZW5naW5lLmdsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCdsaWdodE51bWJlcicsIDApO1xuXG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGxpZ2h0IGdpem1vIGlmIGl0IGV4aXN0cyBhbmQgaXMgdmlzaWJsZS5cbiAgICogVGhpcyBpcyBjYWxsZWQgaW50ZXJuYWxseSBkdXJpbmcgdGhlIGxvZ2ljIHVwZGF0ZSBwaGFzZS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX191cGRhdGVHaXptbygpIHtcbiAgICBpZiAoSXMuZGVmaW5lZCh0aGlzLl9fbGlnaHRHaXptbykgJiYgdGhpcy5fX2xpZ2h0R2l6bW8uaXNTZXR1cCAmJiB0aGlzLmlzTGlnaHRHaXptb1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19saWdodEdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29tbW9uIGxvZ2ljIHVwZGF0ZSBtZXRob2QgdGhhdCBydW5zIG9uY2UgcGVyIGZyYW1lIGZvciBhbGwgbGlnaHQgY29tcG9uZW50cy5cbiAgICogVXBkYXRlcyB0aGUgZ2xvYmFsIGxpZ2h0IGNvdW50IGZvciB0aGUgc2hhZGVyIHN5c3RlbS5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGNvbW1vbl8kbG9naWMoeyBlbmdpbmUgfTogeyBlbmdpbmU6IEVuZ2luZSB9KSB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnRzID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50c1dpdGhUeXBlKExpZ2h0Q29tcG9uZW50KSBhcyBMaWdodENvbXBvbmVudFtdO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9fbGlnaHROdW1iZXIuX3ZbMF0gPSBsaWdodENvbXBvbmVudHMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGxpZ2h0IGNvbXBvbmVudCdzIHN0YXRlIGFuZCB1cGxvYWRzIGRhdGEgdG8gdGhlIEdQVS5cbiAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB0aGUgbGlnaHQgZGlyZWN0aW9uLCBwb3NpdGlvbiwgYW5kIHByb3BlcnRpZXMsXG4gICAqIHRoZW4gc3RvcmVzIHRoZW0gaW4gZ2xvYmFsIGRhdGEgYXJyYXlzIGZvciBzaGFkZXIgYWNjZXNzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBpbXBsZW1lbnRzIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBieSBjaGVja2luZyB1cGRhdGUgY291bnRzXG4gICAqIHRvIGF2b2lkIHVubmVjZXNzYXJ5IHJlY2FsY3VsYXRpb25zIHdoZW4gbm90aGluZyBoYXMgY2hhbmdlZC5cbiAgICovXG4gICRsb2dpYygpIHtcbiAgICBjb25zdCByYW5nZVNjYWxlID0gdGhpcy5fX2VuZ2luZS5jb25maWcubGlnaHRSYW5nZVNjYWxlO1xuICAgIGlmIChcbiAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSA9PT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCAmJlxuICAgICAgdGhpcy5fX2xhc3RVcGRhdGVDb3VudCA9PT0gdGhpcy5fX3VwZGF0ZUNvdW50ICYmXG4gICAgICB0aGlzLl9fbGFzdFJhbmdlU2NhbGUgPT09IHJhbmdlU2NhbGVcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY2VuZUdyYXBoQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuXG4gICAgLy8gT25seSBzcG90IGFuZCBkaXJlY3Rpb25hbCBsaWdodHMgdXNlIHRoZWlyIGRpcmVjdGlvbiBpbiB0aGUgc2hhZGVycy4gUG9pbnQgbGlnaHRzIHNraXAgdGhlIG5vcm1hbCBtYXRyaXhcbiAgICAvLyBjb21wdXRhdGlvbiwgd2hpY2ggbWF0dGVycyB3aGVuIG1hbnkgcG9pbnQgbGlnaHRzIGFyZSBhbmltYXRlZC5cbiAgICBpZiAodGhpcy50eXBlID09PSBMaWdodFR5cGUuU3BvdCB8fCB0aGlzLnR5cGUgPT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5fX2RpcmVjdGlvbiA9IHNjZW5lR3JhcGhDb21wb25lbnQubm9ybWFsTWF0cml4SW5uZXIubXVsdGlwbHlWZWN0b3IodGhpcy5fX2luaXRpYWxEaXJlY3Rpb24pO1xuICAgICAgdGhpcy5fbGlnaHREaXJlY3Rpb24uX3ZbMF0gPSB0aGlzLl9fZGlyZWN0aW9uLng7XG4gICAgICB0aGlzLl9saWdodERpcmVjdGlvbi5fdlsxXSA9IHRoaXMuX19kaXJlY3Rpb24ueTtcbiAgICAgIHRoaXMuX2xpZ2h0RGlyZWN0aW9uLl92WzJdID0gdGhpcy5fX2RpcmVjdGlvbi56O1xuICAgIH1cblxuICAgIGNvbnN0IGlubmVyQ29uZUNvcyA9IE1hdGguY29zKHRoaXMuaW5uZXJDb25lQW5nbGUpO1xuICAgIGNvbnN0IG91dGVyQ29uZUNvcyA9IE1hdGguY29zKHRoaXMub3V0ZXJDb25lQW5nbGUpO1xuXG4gICAgY29uc3QgbGlnaHRQb3NpdGlvbiA9IHNjZW5lR3JhcGhDb21wb25lbnQud29ybGRQb3NpdGlvbjtcbiAgICB0aGlzLl9saWdodFBvc2l0aW9uLl92WzBdID0gbGlnaHRQb3NpdGlvbi54O1xuICAgIHRoaXMuX2xpZ2h0UG9zaXRpb24uX3ZbMV0gPSBsaWdodFBvc2l0aW9uLnk7XG4gICAgdGhpcy5fbGlnaHRQb3NpdGlvbi5fdlsyXSA9IGxpZ2h0UG9zaXRpb24uejtcblxuICAgIGNvbnN0IGVmZmVjdGl2ZVJhbmdlID0gdGhpcy5fX2dldEVmZmVjdGl2ZVJhbmdlKCk7XG4gICAgY29uc3QgaXNSYW5nZWRMb2NhbExpZ2h0ID0gKHRoaXMudHlwZSA9PT0gTGlnaHRUeXBlLlBvaW50IHx8IHRoaXMudHlwZSA9PT0gTGlnaHRUeXBlLlNwb3QpICYmIGVmZmVjdGl2ZVJhbmdlID4gMDtcbiAgICBjb25zdCBpbnRlbnNpdHlTY2FsZSA9IGlzUmFuZ2VkTG9jYWxMaWdodCA/IExpZ2h0Q29tcG9uZW50Ll9fZ2V0SW50ZW5zaXR5U2NhbGUocmFuZ2VTY2FsZSkgOiAxO1xuICAgIGNvbnN0IGFwcGxpZWRSYW5nZVNjYWxlID0gaXNSYW5nZWRMb2NhbExpZ2h0ID8gcmFuZ2VTY2FsZSA6IDE7XG5cbiAgICB0aGlzLl9saWdodEludGVuc2l0eS5fdlswXSA9IHRoaXMuX19jb2xvci54ICogdGhpcy5fX2ludGVuc2l0eSAqIGludGVuc2l0eVNjYWxlO1xuICAgIHRoaXMuX2xpZ2h0SW50ZW5zaXR5Ll92WzFdID0gdGhpcy5fX2NvbG9yLnkgKiB0aGlzLl9faW50ZW5zaXR5ICogaW50ZW5zaXR5U2NhbGU7XG4gICAgdGhpcy5fbGlnaHRJbnRlbnNpdHkuX3ZbMl0gPSB0aGlzLl9fY29sb3IueiAqIHRoaXMuX19pbnRlbnNpdHkgKiBpbnRlbnNpdHlTY2FsZTtcblxuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMF0gPSB0aGlzLmVuYWJsZSA/IHRoaXMudHlwZS5pbmRleCA6IC0xO1xuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMV0gPSBlZmZlY3RpdmVSYW5nZSAqIGFwcGxpZWRSYW5nZVNjYWxlO1xuICAgIHRoaXMuX2xpZ2h0UHJvcGVydHkuX3ZbMl0gPSBpbm5lckNvbmVDb3M7XG4gICAgdGhpcy5fbGlnaHRQcm9wZXJ0eS5fdlszXSA9IG91dGVyQ29uZUNvcztcblxuICAgIHRoaXMuX191cGRhdGVHaXptbygpO1xuXG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1VcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fbGFzdFVwZGF0ZUNvdW50ID0gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICAgIHRoaXMuX19sYXN0UmFuZ2VTY2FsZSA9IHJhbmdlU2NhbGU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaW50ZW5zaXR5IGZhY3RvciB0aGF0IGNvbXBlbnNhdGVzIHRoZSBzaG9ydGVuZWQgcmFuZ2UuIFRoZSBmYWN0b3JzIGFyZSB0aGUgbWVhc3VyZWQgYnJpZ2h0bmVzc1xuICAgKiBiYWxhbmNlIG9mIHRoZSBTcG9uemEgc2NlbmU6IDAuOSAtPiAxLjE2IGFuZCAwLjggLT4gMS4zNS4gVmFsdWVzIGluIGJldHdlZW4gaW50ZXJwb2xhdGU7IGJlbG93IDAuOCB0aGUgbGFzdFxuICAgKiBzbG9wZSBjb250aW51ZXMuIEEgY29uc3RhbnQgZmFjdG9yIGNvbXBlbnNhdGVzIHRoZSByYW5nZSB3aW5kb3cgYXBwcm94aW1hdGVseSwgbm90IGV4YWN0bHkuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldEludGVuc2l0eVNjYWxlKHJhbmdlU2NhbGU6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHJhbmdlU2NhbGUgPj0gMSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChyYW5nZVNjYWxlID49IDAuOSkge1xuICAgICAgcmV0dXJuIDEgKyAoMSAtIHJhbmdlU2NhbGUpICogMS42O1xuICAgIH1cbiAgICBpZiAocmFuZ2VTY2FsZSA+PSAwLjgpIHtcbiAgICAgIHJldHVybiAxLjE2ICsgKDAuOSAtIHJhbmdlU2NhbGUpICogMS45O1xuICAgIH1cbiAgICByZXR1cm4gMS4zNSArICgwLjggLSByYW5nZVNjYWxlKSAqIDEuOTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByYW5nZSB1c2VkIGZvciBzaGFkaW5nLiBQb2ludCBhbmQgc3BvdCBsaWdodHMgd2l0aG91dCBhIHJhbmdlIGdldCBhbiBhdXRvbWF0aWMgcmFuZ2VcbiAgICogd2hlbiBgQ29uZmlnLmxpZ2h0QXV0b1JhbmdlVGhyZXNob2xkYCBpcyBncmVhdGVyIHRoYW4gMC5cbiAgICovXG4gIHByaXZhdGUgX19nZXRFZmZlY3RpdmVSYW5nZSgpIHtcbiAgICBjb25zdCB0aHJlc2hvbGQgPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5saWdodEF1dG9SYW5nZVRocmVzaG9sZDtcbiAgICBpZiAodGhpcy5fX3JhbmdlID4gMCB8fCAhKHRocmVzaG9sZCA+IDApIHx8ICh0aGlzLnR5cGUgIT09IExpZ2h0VHlwZS5Qb2ludCAmJiB0aGlzLnR5cGUgIT09IExpZ2h0VHlwZS5TcG90KSkge1xuICAgICAgcmV0dXJuIHRoaXMuX19yYW5nZTtcbiAgICB9XG4gICAgLy8gVGhlIGRpc3RhbmNlIHdoZXJlIChjb2xvciAqIGludGVuc2l0eSkgLyBkaXN0YW5jZV4yIGZhbGxzIHRvIHRoZSB0aHJlc2hvbGQuXG4gICAgLy8gQSBsaWdodCB3aXRob3V0IGludGVuc2l0eSBnZXRzIGEgdGlueSBwb3NpdGl2ZSByYW5nZSBzbyB0aGF0IGl0IGlzIGN1bGxlZCBpbnN0ZWFkIG9mIGJlaW5nIHVubGltaXRlZC5cbiAgICBjb25zdCBtYXhJbnRlbnNpdHkgPSBNYXRoLm1heCh0aGlzLl9fY29sb3IueCwgdGhpcy5fX2NvbG9yLnksIHRoaXMuX19jb2xvci56KSAqIHRoaXMuX19pbnRlbnNpdHk7XG4gICAgcmV0dXJuIE1hdGgubWF4KE1hdGguc3FydChNYXRoLm1heChtYXhJbnRlbnNpdHksIDApIC8gdGhyZXNob2xkKSwgMWUtNik7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBsaWdodCBjb21wb25lbnQgd2hlbiBpdCdzIGJlaW5nIGRlc3Ryb3llZC5cbiAgICogRGVzdHJveXMgdGhlIGxpZ2h0IGdpem1vIHNvIHRoYXQgaXQgZG9lcyBub3Qgc3RheSBpbiB0aGUgc2NlbmUgYWZ0ZXIgdGhlIGxpZ2h0XG4gICAqIGVudGl0eSAob3Igb25seSBpdHMgTGlnaHRDb21wb25lbnQpIGlzIHJlbW92ZWQsIGFuZCByZXNldHMgdGhlIGxpZ2h0IGludGVuc2l0eVxuICAgKiB2YWx1ZXMgaW4gdGhlIGdsb2JhbCBkYXRhIGFycmF5cy5cbiAgICpcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfZGVzdHJveSgpIHtcbiAgICB0aGlzLl9fbGlnaHRHaXptbz8uX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9fbGlnaHRHaXptbyA9IHVuZGVmaW5lZDtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9faW5jcmVtZW50VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW50aXR5IHRoYXQgb3ducyB0aGlzIGxpZ2h0IGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxpZ2h0IGVudGl0eSBpbnN0YW5jZSB3aXRoIGxpZ2h0LXNwZWNpZmljIG1ldGhvZHNcbiAgICovXG4gIGdldCBlbnRpdHkoKTogSUxpZ2h0RW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmdldEVudGl0eSh0aGlzLl9fZW50aXR5VWlkKSBhcyB1bmtub3duIGFzIElMaWdodEVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGxpZ2h0LXNwZWNpZmljIG1ldGhvZHMgdG8gYW4gZW50aXR5IGNsYXNzIHRocm91Z2ggbWl4aW4gY29tcG9zaXRpb24uXG4gICAqIFRoaXMgbWV0aG9kIGV4dGVuZHMgdGhlIGJhc2UgZW50aXR5IHdpdGggbGlnaHQgY29tcG9uZW50IGZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIEB0ZW1wbGF0ZSBFbnRpdHlCYXNlIC0gVGhlIGJhc2UgZW50aXR5IHR5cGVcbiAgICogQHRlbXBsYXRlIFNvbWVDb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdHlwZVxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSBiYXNlIGVudGl0eSBpbnN0YW5jZSB0byBleHRlbmRcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgKHVudXNlZCBidXQgcmVxdWlyZWQgZm9yIHR5cGUgY29tcGF0aWJpbGl0eSlcbiAgICogQHJldHVybnMgVGhlIGV4dGVuZGVkIGVudGl0eSB3aXRoIGxpZ2h0IGNvbXBvbmVudCBtZXRob2RzXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgTGlnaHRFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIGdldExpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLkxpZ2h0Q29tcG9uZW50VElEKSBhcyBMaWdodENvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgTGlnaHRFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG59XG5MaWdodENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ2xpZ2h0UG9zaXRpb24nLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yMyxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzAsIDAsIDBdLFxufSk7XG5MaWdodENvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ2xpZ2h0RGlyZWN0aW9uJyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVZlY3RvcjMsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFswLCAwLCAwXSxcbn0pO1xuTGlnaHRDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdsaWdodEludGVuc2l0eScsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3IzLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMCwgMCwgMF0sXG59KTtcbkxpZ2h0Q29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnbGlnaHRQcm9wZXJ0eScsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbLTEsIDAsIDAsIDBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FB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QUFXO0FBQUEsRUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQ2pDLGVBQWUsY0FBYztBQUFBLEVBQzdCLFlBQVksQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUN0QixDQUFDO0FBQ0QsZUFBZSxlQUFlO0FBQUEsRUFDNUIsV0FBVyxVQUFVO0FBQUEsRUFDckIsWUFBWTtBQUFBLEVBQ1osZUFBZTtBQUFBLEVBQ2YsWUFBWSxXQUFXO0FBQUEsRUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQ2pDLGVBQWUsY0FBYztBQUFBLEVBQzdCLFlBQVksQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUN0QixDQUFDO0FBQ0QsZUFBZSxlQUFlO0FBQUEsRUFDNUIsV0FBVyxVQUFVO0FBQUEsRUFDckIsWUFBWTtBQUFBLEVBQ1osZUFBZTtBQUFBLEVBQ2YsWUFBWSxXQUFXO0FBQUEsRUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQ2pDLGVBQWUsY0FBYztBQUFBLEVBQzdCLFlBQVksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQzFCLENBQUM7IiwKICAibmFtZXMiOiBbIl9fdHlwZSIsICJfX2NvbG9yIiwgIl9fbGFzdENvbG9yIiwgIl9faW50ZW5zaXR5IiwgIl9faW5pdGlhbERpcmVjdGlvbiIsICJfX2RpcmVjdGlvbiIsICJfX2lubmVyQ29uZUFuZ2xlIiwgIl9fb3V0ZXJDb25lQW5nbGUiLCAiX19yYW5nZSIsICJfX2VuYWJsZSIsICJfX3NoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodCIsICJfX3NoYWRvd1pOZWFyRm9yRGlyZWN0aW9uYWxMaWdodCIsICJfX3NoYWRvd1pOZWFyRm9yU3BvdExpZ2h0IiwgIl9faXNTaGFkb3daTmVhckZvclNwb3RMaWdodEF1dG8iLCAiX19wb2ludExpZ2h0U2hhZG93RmFyUGxhbmUiLCAiX19zaGFkb3dDYW1lcmFPZmZzZXRGb3JEaXJlY3Rpb25hbExpZ2h0IiwgIl9fc2hhZG93U2xvdCIsICJfX3VwZGF0ZUNvdW50IiwgIl9fbGFzdFVwZGF0ZUNvdW50IiwgIl9fbGFzdFRyYW5zZm9ybVVwZGF0ZUNvdW50IiwgIl9fbGFzdFJhbmdlU2NhbGUiLCAiX19pbmNyZW1lbnRVcGRhdGVDb3VudCIsICJfX3VwZGF0ZUNvdW50TWFwIiwgIl9fbWFya1VwZGF0ZWQiLCAiX19lbmdpbmUiLCAiX19saWdodEdpem1vIiwgIl9fbGlnaHROdW1iZXIiLCAiX191cGRhdGVHaXptbyIsICJfX2dldEVmZmVjdGl2ZVJhbmdlIiwgIl9fZ2V0SW50ZW5zaXR5U2NhbGUiLCAiX19lbnRpdHlVaWQiXQp9Cg==
