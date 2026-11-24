import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { ICameraController } from '../../cameras/ICameraController';
import { OrbitCameraController } from '../../cameras/OrbitCameraController';
import { WalkThroughCameraController } from '../../cameras/WalkThroughCameraController';
import { Component } from '../../core/Component';
import { registerComponentRuntimeHooks } from '../../core/ComponentRuntimeHooks';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions';
import { CameraControllerType, type CameraControllerTypeEnum } from '../../definitions/CameraControllerType';
import { Logger } from '../../misc/Logger';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import {
  _deleteCameraControllerUpdateCount,
  _getCameraControllerUpdateCount,
  _setCameraControllerUpdateCount,
} from './CameraControllerUpdateCount';

/**
 * A component that manages and controls camera behavior and movement.
 * Supports different camera controller types including Orbit and WalkThrough cameras.
 */
export class CameraControllerComponent extends Component {
  private __cameraController: ICameraController;

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
    this.__cameraController = new OrbitCameraController(this, engine.config);
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
      this.__cameraController = new OrbitCameraController(this, this.__engine.config);
    } else if (type === CameraControllerType.WalkThrough) {
      this.__cameraController = new WalkThroughCameraController(this);
    } else {
      Logger.default.warn('Not support type!');
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
  static get componentTID() {
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
   * Updates the internal update counter for the current engine.
   *
   * @param count - The new update count value
   */
  _updateCount(count: number) {
    _setCameraControllerUpdateCount(this.__engine, count);
  }

  /**
   * Gets the update counter for camera controller components of the specified engine.
   *
   * @param engine - The engine instance to get the update count for
   * @returns The current update count for the specified engine
   */
  static getUpdateCount(engine: Engine): number {
    return _getCameraControllerUpdateCount(engine);
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

  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine: Engine): void {
    _deleteCameraControllerUpdateCount(engine);
  }
}

/** Update count seen by the last processed frame, per engine (the Engine's initial value was -1). */
const lastUpdateCountMap = new Map<Engine, number>();

// The Engine reaches the camera controller update count through these hooks, so it does not import the
// component (and the orbit/walk-through controllers it creates).
registerComponentRuntimeHooks({
  cleanup: engine => {
    CameraControllerComponent._cleanupForEngine(engine);
    lastUpdateCountMap.delete(engine);
  },
  isDirty: engine => CameraControllerComponent.getUpdateCount(engine) !== (lastUpdateCountMap.get(engine) ?? -1),
  markUpdated: engine => {
    lastUpdateCountMap.set(engine, CameraControllerComponent.getUpdateCount(engine));
  },
});
