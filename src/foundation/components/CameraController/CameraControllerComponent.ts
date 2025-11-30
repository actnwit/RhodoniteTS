import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { ICameraController } from '../../cameras/ICameraController';
import { OrbitCameraController } from '../../cameras/OrbitCameraController';
import { WalkThroughCameraController } from '../../cameras/WalkThroughCameraController';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository, applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions';
import { CameraControllerType, type CameraControllerTypeEnum } from '../../definitions/CameraControllerType';
import { ICameraControllerEntity } from '../../helpers/EntityHelper';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * A component that manages and controls camera behavior and movement.
 * Supports different camera controller types including Orbit and WalkThrough cameras.
 */
export class CameraControllerComponent extends Component {
  private __cameraController: ICameraController;
  private static __updateCount = 0;

  /**
   * Creates a new CameraControllerComponent instance.
   *
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity
   * @param componentSid - The component system identifier
   * @param entityRepository - The entity repository for component management
   * @param isReUse - Whether this component is being reused
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.__cameraController = new OrbitCameraController(this);
  }

  /**
   * Sets the camera controller type and switches to the appropriate controller implementation.
   * Automatically unregisters event listeners from the previous controller.
   *
   * @param type - The camera controller type to switch to
   */
  set type(type: CameraControllerTypeEnum) {
    this.__cameraController.unregisterEventListeners();
    if (type === CameraControllerType.Orbit) {
      this.__cameraController = new OrbitCameraController(this);
    } else if (type === CameraControllerType.WalkThrough) {
      this.__cameraController = new WalkThroughCameraController(this);
    } else {
      Logger.warn('Not support type!');
    }
  }

  /**
   * Gets the current camera controller type.
   *
   * @returns The current camera controller type
   */
  get type() {
    if (this.__cameraController instanceof OrbitCameraController) {
      return CameraControllerType.Orbit;
    }
    return CameraControllerType.WalkThrough;
  }

  /**
   * Gets the current camera controller instance.
   *
   * @returns The active camera controller instance
   */
  get controller() {
    return this.__cameraController;
  }

  /**
   * Gets the component type identifier for CameraControllerComponent.
   *
   * @returns The component type identifier
   */
  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }

  /**
   * Gets the component type identifier for this instance.
   *
   * @returns The component type identifier
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraControllerComponentTID;
  }

  /**
   * Loads the component and moves it to the Logic processing stage.
   */
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Executes the camera controller logic during the Logic processing stage.
   * Updates the camera based on the current controller's implementation.
   */
  $logic() {
    if (this.__cameraController) {
      this.__cameraController.logic(this.entity.tryToGetCamera()!);
    }
  }

  /**
   * Updates the internal update counter.
   *
   * @param count - The new update count value
   */
  _updateCount(count: number) {
    CameraControllerComponent.__updateCount = count;
  }

  /**
   * Gets the current update count.
   *
   * @returns The current update count
   */
  static get updateCount() {
    return CameraControllerComponent.__updateCount;
  }

  /**
   * Adds camera controller functionality to an entity by creating a mixin class.
   * This method extends the given entity base class with camera controller methods.
   *
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   * @param base - The base entity to extend
   * @param _componentClass - The component class (used for type information)
   * @returns The extended entity with camera controller functionality
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class CameraControllerEntity extends (base.constructor as any) {
      getCameraController() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.CameraControllerComponentTID
        ) as CameraControllerComponent;
      }
    }
    applyMixins(base, CameraControllerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
