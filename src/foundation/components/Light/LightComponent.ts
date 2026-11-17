import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { LightType, type LightTypeEnum } from '../../definitions/LightType';
import { ProcessStage } from '../../definitions/ProcessStage';
import { ShaderType } from '../../definitions/ShaderType';
import { LightGizmo } from '../../gizmos/LightGizmo';
import type { ILightEntity } from '../../helpers/EntityHelper';
import { MutableVector3 } from '../../math';
import { MutableVector4 } from '../../math/MutableVector4';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { Is } from '../../misc/Is';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { TransformComponent } from '../Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * The Component that represents a light.
 *
 * @remarks
 * the light looks towards the local -Z axis in right hand coordinate system.
 */
export class LightComponent extends Component {
  private __type = LightType.Point;
  private __color = Vector3.fromCopyArray([1, 1, 1]);
  /** The components of the color at the last change, to detect changes of a mutated color object. */
  private __lastColor = [1, 1, 1];
  private __intensity = 1;
  private readonly __initialDirection = Vector3.fromCopyArray([0, 0, -1]);
  private __direction = Vector3.fromCopyArray([0, 0, -1]);
  private __innerConeAngle = 0.0;
  private __outerConeAngle = Math.PI / 4.0; // in radian
  private __range = -1;
  private __enable = true;
  private __shadowAreaSizeForDirectionalLight = 10;
  private __shadowZNearForDirectionalLight = 0.1;
  private __shadowCameraOffsetForDirectionalLight = Vector3.zero();
  public castShadow = false;
  private _lightPosition = MutableVector4.dummy();
  private _lightDirection = MutableVector4.dummy();
  private _lightIntensity = MutableVector4.dummy();
  private _lightProperty = MutableVector4.dummy();
  private static __lightNumber = Scalar.zero();
  private __lightGizmo?: LightGizmo;
  /** The shadow slot assigned by a ShadowSystem. `undefined` means the default slot (see `_shadowSlot`). */
  private __shadowSlot: number | undefined = undefined;

  private __updateCount = 0;
  private __lastUpdateCount = -1;
  private __lastTransformUpdateCount = -1;
  private __lastRangeScale = -1;
  /** The number of changes of all light components, per engine. */
  private static __updateCountMap: Map<Engine, number> = new Map();

  /**
   * Creates a new LightComponent instance.
   *
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityRepository - The entity repository instance
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);

    this.submitToAllocation(engine.config.lightComponentCountPerBufferView, isReUse);
    LightComponent.__incrementUpdateCount(engine);
  }

  /**
   * Gets the number of changes of all light components of the engine (creation, destruction and property changes).
   * The engine and the rendering strategies use it to process and upload the light data only when it changed.
   *
   * @param engine - The engine instance
   * @returns The update count
   */
  static getUpdateCount(engine: Engine): number {
    return this.__updateCountMap.get(engine) ?? 0;
  }

  private static __incrementUpdateCount(engine: Engine): void {
    this.__updateCountMap.set(engine, (this.__updateCountMap.get(engine) ?? 0) + 1);
  }

  /**
   * Cleans up the static data of the engine.
   * @internal
   */
  static _cleanupForEngine(engine: Engine): void {
    this.__updateCountMap.delete(engine);
  }

  /**
   * Records a change of a property, so that the light data is recomputed and uploaded.
   */
  private __markUpdated() {
    this.__updateCount++;
    LightComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets the type of the light.
   */
  get type(): LightTypeEnum {
    return this.__type;
  }

  /**
   * Sets the type of the light.
   */
  set type(value: LightTypeEnum) {
    if (this.__type !== value) {
      this.__type = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets whether the light is enabled.
   */
  get enable(): boolean {
    return this.__enable;
  }

  /**
   * Sets whether the light is enabled. A disabled light does not light anything.
   */
  set enable(value: boolean) {
    if (this.__enable !== value) {
      this.__enable = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets the inner cone angle of the spot light (in radian).
   */
  get innerConeAngle(): number {
    return this.__innerConeAngle;
  }

  /**
   * Sets the inner cone angle of the spot light (in radian).
   */
  set innerConeAngle(value: number) {
    if (this.__innerConeAngle !== value) {
      this.__innerConeAngle = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets the outer cone angle of the spot light (in radian).
   */
  get outerConeAngle(): number {
    return this.__outerConeAngle;
  }

  /**
   * Sets the outer cone angle of the spot light (in radian).
   */
  set outerConeAngle(value: number) {
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
  get componentTID(): ComponentTID {
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
  set intensity(value: number) {
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
  get intensity(): number {
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
  set range(value: number) {
    if (this.__range !== value) {
      this.__range = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets the effective range of the light.
   */
  get range(): number {
    return this.__range;
  }

  /**
   * Sets the orthographic half-size used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set orthographic extents.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowAreaSizeForDirectionalLight(value: number) {
    if (this.__shadowAreaSizeForDirectionalLight !== value) {
      this.__shadowAreaSizeForDirectionalLight = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets the orthographic half-size used for DirectionalLight shadow camera.
   */
  get shadowAreaSizeForDirectionalLight(): number {
    return this.__shadowAreaSizeForDirectionalLight;
  }

  /**
   * Sets the zNear value used for DirectionalLight shadow camera.
   *
   * @remarks
   * CameraComponent syncs to light each frame and uses this to set zNear.
   * Updating this property increments updateCount so camera sync is refreshed.
   */
  set shadowZNearForDirectionalLight(value: number) {
    if (this.__shadowZNearForDirectionalLight !== value) {
      this.__shadowZNearForDirectionalLight = value;
      this.__markUpdated();
    }
  }

  /**
   * Gets the zNear value used for DirectionalLight shadow camera.
   */
  get shadowZNearForDirectionalLight(): number {
    return this.__shadowZNearForDirectionalLight;
  }

  /**
   * Sets the shadow camera offset for DirectionalLight.
   * This offset is applied to position the shadow camera at the scene center.
   */
  set shadowCameraOffsetForDirectionalLight(value: Vector3) {
    this.__shadowCameraOffsetForDirectionalLight = value;
    this.__markUpdated();
  }

  /**
   * Gets the shadow camera offset for DirectionalLight.
   */
  get shadowCameraOffsetForDirectionalLight(): Vector3 {
    return this.__shadowCameraOffsetForDirectionalLight;
  }

  /**
   * Sets the color of the light.
   *
   * @param value - The RGB color vector (values typically 0.0 to 1.0)
   */
  set color(value: Vector3) {
    this.__color = value;
    // The same (mutated) object may be set again, so the values are compared with the last values.
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
  get color(): Vector3 {
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
  get _shadowSlot(): number {
    if (this.__shadowSlot !== undefined) {
      return this.__shadowSlot;
    }
    return this.componentSID < this.__engine.config.maxLightNumber ? this.componentSID : -1;
  }

  /**
   * Sets the shadow slot of this light. `undefined` restores the default slot.
   *
   * @internal
   */
  set _shadowSlot(slot: number | undefined) {
    this.__shadowSlot = slot;
  }

  /**
   * The world position of the light as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightPositionForGpu(): MutableVector4 {
    return this._lightPosition;
  }

  /**
   * The world direction of the light as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightDirectionForGpu(): MutableVector4 {
    return this._lightDirection;
  }

  /**
   * The light property (type, effective range, cos of the inner and outer cone angles) as uploaded to the GPU
   * (updated in $logic).
   *
   * @internal
   */
  get _lightPropertyForGpu(): MutableVector4 {
    return this._lightProperty;
  }

  /**
   * The intensity of the light (color * intensity) as uploaded to the GPU (updated in $logic).
   *
   * @internal
   */
  get _lightIntensityForGpu(): MutableVector4 {
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
  set isLightGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__lightGizmo)) {
        this.__lightGizmo = new LightGizmo(this.entity.engine, this.entity);
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
    LightComponent.__lightNumber = this.entity.engine.globalDataRepository.getValue('lightNumber', 0);

    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Updates the light gizmo if it exists and is visible.
   * This is called internally during the logic update phase.
   *
   * @private
   */
  private __updateGizmo() {
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
  static common_$logic({ engine }: { engine: Engine }) {
    const lightComponents = engine.componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    LightComponent.__lightNumber._v[0] = lightComponents.length;
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
    if (
      TransformComponent.getUpdateCount(this.__engine) === this.__lastTransformUpdateCount &&
      this.__lastUpdateCount === this.__updateCount &&
      this.__lastRangeScale === rangeScale
    ) {
      return;
    }

    const sceneGraphComponent = this.entity.getSceneGraph();

    this.__direction = sceneGraphComponent.normalMatrixInner.multiplyVector(this.__initialDirection);

    const innerConeCos = Math.cos(this.innerConeAngle);
    const outerConeCos = Math.cos(this.outerConeAngle);

    this._lightDirection._v[0] = this.__direction.x;
    this._lightDirection._v[1] = this.__direction.y;
    this._lightDirection._v[2] = this.__direction.z;

    const lightPosition = sceneGraphComponent.worldPosition;
    this._lightPosition._v[0] = lightPosition.x;
    this._lightPosition._v[1] = lightPosition.y;
    this._lightPosition._v[2] = lightPosition.z;

    const effectiveRange = this.__getEffectiveRange();
    const isRangedLocalLight = (this.type === LightType.Point || this.type === LightType.Spot) && effectiveRange > 0;
    const intensityScale = isRangedLocalLight ? LightComponent.__getIntensityScale(rangeScale) : 1;
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
  private static __getIntensityScale(rangeScale: number): number {
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
  private __getEffectiveRange() {
    const threshold = this.__engine.config.lightAutoRangeThreshold;
    if (this.__range > 0 || !(threshold > 0) || (this.type !== LightType.Point && this.type !== LightType.Spot)) {
      return this.__range;
    }
    // The distance where (color * intensity) / distance^2 falls to the threshold.
    // A light without intensity gets a tiny positive range so that it is culled instead of being unlimited.
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
    LightComponent.__incrementUpdateCount(this.__engine);
  }

  /**
   * Gets the entity that owns this light component.
   *
   * @returns The light entity instance with light-specific methods
   */
  get entity(): ILightEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as ILightEntity;
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
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class LightEntity extends (base.constructor as any) {
      getLight() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.LightComponentTID) as LightComponent;
      }
    }
    applyMixins(base, LightEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'lightPosition',
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0],
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'lightDirection',
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0],
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'lightIntensity',
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0],
});
LightComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: 'lightProperty',
  dataClassType: MutableVector4,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec4,
  componentType: ComponentType.Float,
  initValues: [-1, 0, 0, 0],
});
