import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { LightType } from '../../definitions/LightType';
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
  public type = LightType.Point;
  private __color = Vector3.fromCopyArray([1, 1, 1]);
  private __intensity = 1;
  private readonly __initialDirection = Vector3.fromCopyArray([0, 0, -1]);
  private __direction = Vector3.fromCopyArray([0, 0, -1]);
  public innerConeAngle = 0.0;
  public outerConeAngle = Math.PI / 4.0; // in radian
  private __range = -1;
  public enable = true;
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

  private __updateCount = 0;
  private __lastUpdateCount = -1;
  private __lastTransformUpdateCount = -1;

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
  }

  /**
   * Gets the component type identifier for LightComponent.
   *
   * @returns The component type identifier
   */
  static get componentTID(): ComponentTID {
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
    this.__intensity = value;
    this.__updateCount++;
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
    this.__range = value;
    this.__updateCount++;
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
    this.__shadowAreaSizeForDirectionalLight = value;
    this.__updateCount++;
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
    this.__shadowZNearForDirectionalLight = value;
    this.__updateCount++;
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
    this.__updateCount++;
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
    this.__updateCount++;
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
    this.__updateCount++;
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
    if (
      TransformComponent.getUpdateCount(this.__engine) === this.__lastTransformUpdateCount &&
      this.__lastUpdateCount === this.__updateCount
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

    this._lightIntensity._v[0] = this.__color.x * this.__intensity;
    this._lightIntensity._v[1] = this.__color.y * this.__intensity;
    this._lightIntensity._v[2] = this.__color.z * this.__intensity;

    this._lightProperty._v[0] = this.enable ? this.type.index : -1;
    this._lightProperty._v[1] = this.range;
    this._lightProperty._v[2] = innerConeCos;
    this._lightProperty._v[3] = outerConeCos;

    this.__updateGizmo();

    this.__lastTransformUpdateCount = TransformComponent.getUpdateCount(this.__engine);
    this.__lastUpdateCount = this.__updateCount;
  }

  /**
   * Cleans up the light component when it's being destroyed.
   * Resets the light intensity values in the global data arrays.
   *
   * @override
   */
  _destroy() {
    super._destroy();
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
