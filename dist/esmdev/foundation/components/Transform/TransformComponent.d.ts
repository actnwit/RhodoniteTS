import type { Array3, Array4, ComponentTID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import type { ITransformEntity } from '../../helpers';
import type { IMatrix44 } from '../../math/IMatrix';
import type { IQuaternion } from '../../math/IQuaternion';
import type { IVector3 } from '../../math/IVector';
import type { MutableMatrix44 } from '../../math/MutableMatrix44';
import type { MutableVector3 } from '../../math/MutableVector3';
import { Quaternion } from '../../math/Quaternion';
import { Transform3D } from '../../math/Transform3D';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * TransformComponent is a component that manages the transform of an entity.
 * It handles position, rotation, scale, and transformation matrices for 3D objects.
 * This component provides both current transform state and rest pose functionality.
 */
export declare class TransformComponent extends Component {
    private __rest;
    private __pose;
    private __updateCountAtLastLogic;
    /** Map to store update count per Engine instance for multi-engine support */
    private static __updateCountMap;
    /**
     * Gets the number of rendered properties for this component type.
     * @returns null as this component doesn't have rendered properties
     */
    static get renderedPropertyCount(): null;
    /**
     * Gets the component type identifier for TransformComponent.
     * @returns The transform component type ID
     */
    static get componentTID(): 3;
    /**
     * Gets the component type identifier for this instance.
     * @returns The transform component type ID
     */
    get componentTID(): ComponentTID;
    /**
     * Gets the rest transform if available, otherwise returns the current pose.
     * @returns The rest transform or current pose
     */
    get restOrPose(): Transform3D;
    /**
     * Gets the update counter for transform components of the specified engine.
     * @param engine - The engine instance to get the update count for
     * @returns The current update count for the specified engine
     */
    static getUpdateCount(engine: Engine): number;
    /**
     * Increments the update counter for the specified engine.
     * @param engine - The engine instance to increment the update count for
     * @internal
     */
    private static __incrementUpdateCount;
    /**
     * Backs up the current transform as the rest pose.
     * Creates a rest pose snapshot and marks the scene graph world matrix as dirty.
     * @internal
     */
    _backupTransformAsRest(): void;
    /**
     * Restores the transform from the previously backed up rest pose.
     * @internal
     */
    _restoreTransformFromRest(): void;
    /**
     * Gets the local transform of this entity.
     * @returns The current local transform
     */
    get localTransform(): Transform3D;
    /**
     * Sets the local transform of this entity.
     * @param transform - The new transform to apply
     */
    set localTransform(transform: Transform3D);
    /**
     * Gets the local transform rest pose.
     * @returns The rest pose or current pose if no rest pose is set
     */
    get localTransformRest(): Transform3D;
    /**
     * Sets the local transform rest pose.
     * @param transform - The transform to set as rest pose
     */
    set localTransformRest(transform: Transform3D);
    /**
     * Sets the local position of this entity and updates physics if applicable.
     * @param vec - The new position vector
     */
    set localPosition(vec: IVector3);
    /**
     * Sets the local position without updating physics simulation.
     * @param vec - The new position vector
     */
    set localPositionWithoutPhysics(vec: IVector3);
    /**
     * Sets the local position using a 3-element array.
     * @param array - Array containing [x, y, z] position values
     */
    setLocalPositionAsArray3(array: Array3<number>): void;
    /**
     * Gets a copy of the local position vector.
     * @returns A copy of the local position
     */
    get localPosition(): IVector3;
    /**
     * Gets the internal mutable local position vector.
     * @returns The internal mutable position vector
     */
    get localPositionInner(): MutableVector3;
    /**
     * Sets the local position as rest pose.
     * @param vec - The position vector to set as rest
     */
    set localPositionRest(vec: IVector3);
    /**
     * Gets a copy of the local position rest vector.
     * @returns A copy of the rest position
     */
    get localPositionRest(): IVector3;
    /**
     * Gets the internal mutable local position rest vector.
     * @returns The internal mutable rest position vector
     */
    get localPositionRestInner(): MutableVector3;
    /**
     * Sets the local rotation using Euler angles and updates physics if applicable.
     * @param vec - The Euler angles vector (XYZ order)
     */
    set localEulerAngles(vec: IVector3);
    /**
     * Sets the local Euler angles without updating physics simulation.
     * @param vec - The Euler angles vector (XYZ order)
     */
    set localEulerAnglesWithoutPhysics(vec: IVector3);
    /**
     * Gets a copy of the local Euler angles vector.
     * @returns A copy of the local rotation as Euler angles (XYZ order)
     */
    get localEulerAngles(): IVector3;
    /**
     * Gets the internal mutable local Euler angles vector.
     * @returns The internal mutable Euler angles vector
     */
    get localEulerAnglesInner(): Vector3;
    /**
     * Sets the local Euler angles as rest pose.
     * @param vec - The Euler angles vector to set as rest (XYZ order)
     */
    set localEulerAnglesRest(vec: IVector3);
    /**
     * Gets a copy of the local Euler angles rest vector.
     * @returns A copy of the rest rotation as Euler angles (XYZ order)
     */
    get localEulerAnglesRest(): IVector3;
    /**
     * Gets the internal mutable local Euler angles rest vector.
     * @returns The internal mutable rest Euler angles vector
     */
    get localEulerAnglesRestInner(): Vector3;
    /**
     * Sets the local scale and updates physics if applicable.
     * @param vec - The new scale vector
     */
    set localScale(vec: IVector3);
    /**
     * Sets the local scale without updating physics simulation.
     * @param vec - The new scale vector
     */
    set localScaleWithoutPhysics(vec: IVector3);
    /**
     * Sets the local scale using a 3-element array.
     * @param array - Array containing [x, y, z] scale values
     */
    setLocalScaleAsArray3(array: Array3<number>): void;
    /**
     * Gets a copy of the local scale vector.
     * @returns A copy of the local scale
     */
    get localScale(): IVector3;
    /**
     * Gets the internal mutable local scale vector.
     * @returns The internal mutable scale vector
     */
    get localScaleInner(): MutableVector3;
    /**
     * Sets the local scale as rest pose.
     * @param vec - The scale vector to set as rest
     */
    set localScaleRest(vec: IVector3);
    /**
     * Gets a copy of the local scale rest vector.
     * @returns A copy of the rest scale
     */
    get localScaleRest(): IVector3;
    /**
     * Gets the internal mutable local scale rest vector.
     * @returns The internal mutable rest scale vector
     */
    get localScaleRestInner(): MutableVector3;
    /**
     * Sets the local rotation using a quaternion and updates physics if applicable.
     * @param quat - The new rotation quaternion
     */
    set localRotation(quat: IQuaternion);
    /**
     * Sets the local rotation without updating physics simulation.
     * @param quat - The new rotation quaternion
     */
    set localRotationWithoutPhysics(quat: IQuaternion);
    /**
     * Sets the local rotation using a 4-element array.
     * @param array - Array containing [x, y, z, w] quaternion values
     */
    setLocalRotationAsArray4(array: Array4<number>): void;
    /**
     * Gets a copy of the local rotation quaternion.
     * @returns A copy of the local rotation quaternion
     */
    get localRotation(): IQuaternion;
    /**
     * Gets the internal local rotation quaternion.
     * @returns The internal rotation quaternion
     */
    get localRotationInner(): Quaternion;
    /**
     * Sets the local rotation as rest pose.
     * @param quat - The rotation quaternion to set as rest
     */
    set localRotationRest(quat: IQuaternion);
    /**
     * Gets a copy of the local rotation rest quaternion.
     * @returns A copy of the rest rotation quaternion
     */
    get localRotationRest(): IQuaternion;
    /**
     * Gets the internal local rotation rest quaternion.
     * @returns The internal rest rotation quaternion
     */
    get localRotationRestInner(): Quaternion;
    /**
     * Sets the local transformation matrix.
     * @param mat - The new transformation matrix
     */
    set localMatrix(mat: IMatrix44);
    set localMatrixWithoutPhysics(mat: IMatrix44);
    /**
     * Gets a copy of the local transformation matrix.
     * @returns A copy of the local transform matrix
     */
    get localMatrix(): IMatrix44;
    /**
     * Gets the internal local transformation matrix.
     * @returns The internal local transform matrix
     */
    get localMatrixInner(): MutableMatrix44;
    /**
     * Copies the local transformation matrix to the provided matrix object.
     * @param mat - The target matrix to copy the local matrix into
     */
    getLocalMatrixInnerTo(mat: MutableMatrix44): void;
    /**
     * Sets the local transformation matrix as rest pose.
     * @param mat - The transformation matrix to set as rest
     */
    set localMatrixRest(mat: IMatrix44);
    /**
     * Gets a copy of the local transformation matrix rest pose.
     * @returns A copy of the rest transform matrix
     */
    get localMatrixRest(): IMatrix44;
    /**
     * Gets the internal local transformation matrix rest pose.
     * @returns The internal rest transform matrix
     */
    get localMatrixRestInner(): MutableMatrix44;
    /**
     * Loads the component and moves it to the Logic processing stage.
     * @internal
     */
    $load(): void;
    /**
     * Executes logic processing for the component.
     * Checks if the transform has been updated and marks the world matrix as dirty if needed.
     * @internal
     */
    $logic(): void;
    /**
     * Performs a shallow copy from another TransformComponent.
     * @param component_ - The source component to copy from
     * @internal
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Gets the entity that owns this component.
     * @returns The entity which has this component
     */
    get entity(): ITransformEntity;
    /**
     * Destroys the component and cleans up resources.
     * @internal
     */
    _destroy(): void;
    /**
     * Adds this component to the specified entity by creating a mixin class.
     * This method extends the entity class with transform-related methods and properties.
     * @param base - The target entity to extend
     * @param _componentClass - The component class to add (not used but required for interface)
     * @returns The extended entity with transform capabilities
     * @template EntityBase - The base entity type
     * @template SomeComponentClass - The component class type
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
