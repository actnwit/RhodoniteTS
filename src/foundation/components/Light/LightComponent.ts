import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { Config } from '../../core/Config';
import type { IEntity } from '../../core/Entity';
import { EntityRepository, applyMixins } from '../../core/EntityRepository';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { LightType } from '../../definitions/LightType';
import { ProcessStage } from '../../definitions/ProcessStage';
import { LightGizmo } from '../../gizmos/LightGizmo';
import type { ILightEntity } from '../../helpers/EntityHelper';
import { MutableVector4 } from '../../math/MutableVector4';
import { Scalar } from '../../math/Scalar';
import { Vector3 } from '../../math/Vector3';
import { VectorN } from '../../math/VectorN';
import { Is } from '../../misc/Is';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { TransformComponent } from '../Transform';
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
  public range = -1;
  public enable = true;
  public shadowAreaSizeForDirectionalLight = 10;
  public castShadow = false;
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tmp_vec4 = MutableVector4.zero();
  private static __lightPositions = new VectorN(new Float32Array(0));
  private static __lightDirections = new VectorN(new Float32Array(0));
  private static __lightIntensities = new VectorN(new Float32Array(0));
  private static __lightProperties = new VectorN(new Float32Array(0));
  private static __lightNumber = Scalar.zero();
  private __lightGizmo?: LightGizmo;

  private __updateCount = 0;
  private __lastUpdateCount = -1;
  private __lastTransformUpdateCount = -1;

  /**
   * Creates a new LightComponent instance.
   *
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component session identifier
   * @param entityRepository - The entity repository instance
   * @param isReUse - Whether this component is being reused
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityRepository, isReUse);

    this._setMaxNumberOfComponent(Math.max(10, Math.floor(Config.maxEntityNumber / 100)));
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
        this.__lightGizmo = new LightGizmo(this.entity);
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
    LightComponent.__lightPositions = LightComponent.__globalDataRepository.getValue('lightPosition', 0);
    LightComponent.__lightDirections = LightComponent.__globalDataRepository.getValue('lightDirection', 0);
    LightComponent.__lightIntensities = LightComponent.__globalDataRepository.getValue('lightIntensity', 0);
    LightComponent.__lightProperties = LightComponent.__globalDataRepository.getValue('lightProperty', 0);
    LightComponent.__lightNumber = LightComponent.__globalDataRepository.getValue('lightNumber', 0);

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
  static common_$logic() {
    const lightComponents = ComponentRepository.getComponentsWithType(LightComponent) as LightComponent[];
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
      TransformComponent.updateCount === this.__lastTransformUpdateCount &&
      this.__lastUpdateCount === this.__updateCount
    ) {
      return;
    }

    const sceneGraphComponent = this.entity.getSceneGraph();

    this.__direction = sceneGraphComponent.normalMatrixInner.multiplyVector(this.__initialDirection);

    const innerConeCos = Math.cos(this.innerConeAngle);
    const outerConeCos = Math.cos(this.outerConeAngle);

    LightComponent.__lightDirections._v[3 * this.componentSID + 0] = this.__direction.x;
    LightComponent.__lightDirections._v[3 * this.componentSID + 1] = this.__direction.y;
    LightComponent.__lightDirections._v[3 * this.componentSID + 2] = this.__direction.z;

    const lightPosition = sceneGraphComponent.worldPosition;
    LightComponent.__lightPositions._v[3 * this.componentSID + 0] = lightPosition.x;
    LightComponent.__lightPositions._v[3 * this.componentSID + 1] = lightPosition.y;
    LightComponent.__lightPositions._v[3 * this.componentSID + 2] = lightPosition.z;

    LightComponent.__lightIntensities._v[3 * this.componentSID + 0] = this.__color.x * this.__intensity;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 1] = this.__color.y * this.__intensity;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 2] = this.__color.z * this.__intensity;

    LightComponent.__lightProperties._v[4 * this.componentSID + 0] = this.enable ? this.type.index : -1;
    LightComponent.__lightProperties._v[4 * this.componentSID + 1] = this.range;
    LightComponent.__lightProperties._v[4 * this.componentSID + 2] = innerConeCos;
    LightComponent.__lightProperties._v[4 * this.componentSID + 3] = outerConeCos;

    this.__updateGizmo();

    this.__lastTransformUpdateCount = TransformComponent.updateCount;
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
    LightComponent.__lightIntensities._v[3 * this.componentSID + 0] = 0;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 1] = 0;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 2] = 0;
  }

  /**
   * Gets the entity that owns this light component.
   *
   * @returns The light entity instance with light-specific methods
   */
  get entity(): ILightEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ILightEntity;
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
