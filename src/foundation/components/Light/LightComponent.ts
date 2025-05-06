import { ComponentRepository } from '../../core/ComponentRepository';
import { Component } from '../../core/Component';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { LightType } from '../../definitions/LightType';
import { Vector3 } from '../../math/Vector3';
import { ProcessStage } from '../../definitions/ProcessStage';
import { Config } from '../../core/Config';
import { ComponentTID, EntityUID, ComponentSID } from '../../../types/CommonTypes';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { MutableVector4 } from '../../math/MutableVector4';
import { VectorN } from '../../math/VectorN';
import { ILightEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { LightGizmo } from '../../gizmos/LightGizmo';
import { Is } from '../../misc/Is';
import { Scalar } from '../../math/Scalar';
import { TransformComponent } from '../Transform';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';

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

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);

    this._setMaxNumberOfComponent(Math.max(10, Math.floor(Config.maxEntityNumber / 100)));
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

  get updateCount() {
    return this.__updateCount;
  }

  get direction() {
    return this.__direction;
  }

  set intensity(value: number) {
    this.__intensity = value;
    this.__updateCount++;
  }

  get intensity(): number {
    return this.__intensity;
  }

  set color(value: Vector3) {
    this.__color = value;
    this.__updateCount++;
  }

  get color(): Vector3 {
    return this.__color;
  }

  get _up() {
    return Vector3.fromCopy3(0, 1, 0);
  }

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

  get isLightGizmoVisible() {
    if (Is.defined(this.__lightGizmo)) {
      return this.__lightGizmo.isVisible;
    } else {
      return false;
    }
  }

  $load() {
    LightComponent.__lightPositions = LightComponent.__globalDataRepository.getValue(
      'lightPosition',
      0
    );
    LightComponent.__lightDirections = LightComponent.__globalDataRepository.getValue(
      'lightDirection',
      0
    );
    LightComponent.__lightIntensities = LightComponent.__globalDataRepository.getValue(
      'lightIntensity',
      0
    );
    LightComponent.__lightProperties = LightComponent.__globalDataRepository.getValue(
      'lightProperty',
      0
    );
    LightComponent.__lightNumber = LightComponent.__globalDataRepository.getValue('lightNumber', 0);

    this.moveStageTo(ProcessStage.Logic);
  }

  private __updateGizmo() {
    if (Is.defined(this.__lightGizmo) && this.__lightGizmo.isSetup && this.isLightGizmoVisible) {
      this.__lightGizmo._update();
    }
  }

  static common_$logic() {
    const lightComponents = ComponentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];
    LightComponent.__lightNumber._v[0] = lightComponents.length;
  }

  $logic() {
    if (
      TransformComponent.updateCount === this.__lastTransformUpdateCount &&
      this.__lastUpdateCount === this.__updateCount
    ) {
      return;
    }

    const sceneGraphComponent = this.entity.getSceneGraph();

    this.__direction = sceneGraphComponent.normalMatrixInner.multiplyVector(
      this.__initialDirection
    );

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

    LightComponent.__lightProperties._v[4 * this.componentSID + 0] = this.enable
      ? this.type.index
      : -1;
    LightComponent.__lightProperties._v[4 * this.componentSID + 1] = this.range;
    LightComponent.__lightProperties._v[4 * this.componentSID + 2] = innerConeCos;
    LightComponent.__lightProperties._v[4 * this.componentSID + 3] = outerConeCos;

    this.__updateGizmo();

    this.__lastTransformUpdateCount = TransformComponent.updateCount;
    this.__lastUpdateCount = this.__updateCount;
  }

  _destroy() {
    super._destroy();
    LightComponent.__lightIntensities._v[3 * this.componentSID + 0] = 0;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 1] = 0;
    LightComponent.__lightIntensities._v[3 * this.componentSID + 2] = 0;
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): ILightEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ILightEntity;
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class LightEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getLight() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.LightComponentTID
        ) as LightComponent;
      }
    }
    applyMixins(base, LightEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
