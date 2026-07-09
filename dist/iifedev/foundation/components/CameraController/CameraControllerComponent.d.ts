import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { ICameraController } from '../../cameras/ICameraController';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type CameraControllerTypeEnum } from '../../definitions/CameraControllerType';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * A component that manages and controls camera behavior and movement.
 * Supports different camera controller types including Orbit and WalkThrough cameras.
 */
export declare class CameraControllerComponent extends Component {
    private __cameraController;
    /** Map to store update count per Engine instance for multi-engine support */
    private static __updateCountMap;
    /**
     * Creates a new CameraControllerComponent instance.
     *
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity
     * @param componentSid - The component system identifier
     * @param entityRepository - The entity repository for component management
     * @param isReUse - Whether this component is being reused
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Sets the camera controller type and switches to the appropriate controller implementation.
     * Automatically unregisters event listeners from the previous controller.
     *
     * @param type - The camera controller type to switch to
     */
    set type(type: CameraControllerTypeEnum);
    /**
     * Gets the current camera controller type.
     *
     * @returns The current camera controller type
     */
    get type(): CameraControllerTypeEnum;
    /**
     * Gets the current camera controller instance.
     *
     * @returns The active camera controller instance
     */
    get controller(): ICameraController;
    /**
     * Gets the component type identifier for CameraControllerComponent.
     *
     * @returns The component type identifier
     */
    static get componentTID(): 8;
    /**
     * Gets the component type identifier for this instance.
     *
     * @returns The component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Loads the component and moves it to the Logic processing stage.
     */
    $load(): void;
    /**
     * Executes the camera controller logic during the Logic processing stage.
     * Updates the camera based on the current controller's implementation.
     */
    $logic(): void;
    /**
     * Updates the internal update counter for the current engine.
     *
     * @param count - The new update count value
     */
    _updateCount(count: number): void;
    /**
     * Gets the update counter for camera controller components of the specified engine.
     *
     * @param engine - The engine instance to get the update count for
     * @returns The current update count for the specified engine
     */
    static getUpdateCount(engine: Engine): number;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
