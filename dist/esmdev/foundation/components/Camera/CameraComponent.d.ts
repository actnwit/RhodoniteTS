import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type CameraTypeEnum } from '../../definitions/CameraType';
import { Frustum } from '../../geometry/Frustum';
import type { ICameraEntity } from '../../helpers/EntityHelper';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that represents a camera.
 *
 * @remarks
 * The camera is defined such that the local +X axis is to the right,
 * the "lens" looks towards the local -Z axis,
 * and the top of the camera is aligned with the local +Y axis.
 */
export declare class CameraComponent extends Component {
    private static readonly _eye;
    private _eyeInner;
    private _direction;
    private _directionInner;
    private _up;
    private _upInner;
    private _filmWidth;
    private _filmHeight;
    private _focalLength;
    private primitiveMode;
    private _corner;
    private _cornerInner;
    private _parameters;
    private _parametersInner;
    private __type;
    private _projectionMatrix;
    private _viewMatrix;
    private _viewPosition;
    private static __currentMap;
    private static returnVector3;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpMatrix44_0;
    private static __tmpMatrix44_1;
    private static __biasMatrixWebGL;
    private static __biasMatrixWebGPU;
    _xrLeft: boolean;
    _xrRight: boolean;
    isSyncToLight: boolean;
    private __frustum;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastLightComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    /**
     * Creates a new CameraComponent instance.
     *
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component system identifier
     * @param entityRepository - The entity repository instance
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Gets the current active camera component ID for a specific engine.
     *
     * @param engine - The engine instance
     * @returns The component system identifier of the current active camera for the engine
     */
    static getCurrent(engine: Engine): ComponentSID;
    /**
     * Sets the current active camera component for a specific engine.
     *
     * @param engine - The engine instance
     * @param componentSID - The component system identifier of the camera to set as current
     */
    static setCurrent(engine: Engine, componentSID: ComponentSID): void;
    /**
     * Gets the update count for this camera component.
     *
     * @returns The number of times this camera has been updated
     */
    get updateCount(): number;
    /**
     * Gets the update count of the current active camera.
     *
     * @param engine - The engine instance
     * @returns The update count of the current camera, or 0 if no camera is active
     */
    static getCurrentCameraUpdateCount(engine: Engine): number;
    /**
     * Sets the camera type (perspective, orthographic, or frustum).
     *
     * @param type - The camera type to set
     */
    set type(type: CameraTypeEnum);
    /**
     * Gets the camera type.
     *
     * @returns The current camera type
     */
    get type(): CameraTypeEnum;
    /**
     * Gets the camera eye position (always (0,0,0) in Rhodonite).
     *
     * @returns The eye position vector (always zero)
     */
    get eye(): Vector3;
    /**
     * Attempts to set the eye position (throws error as this is not supported).
     *
     * @param noUseVec - The vector to set (not used)
     * @throws Always throws an error as eye positioning should use TransformComponent
     */
    set eye(_noUseVec: Vector3);
    /**
     * Gets the internal eye position.
     *
     * @returns The internal eye position vector
     */
    get eyeInner(): Vector3;
    /**
     * Sets the internal eye position.
     *
     * @param vec - The vector to set as the internal eye position
     * @internal
     */
    set eyeInner(vec: Vector3);
    /**
     * Sets the internal up vector.
     *
     * @param vec - The vector to set as the internal up direction
     */
    set upInner(vec: Vector3);
    /**
     * Sets the up vector of the camera.
     *
     * @param vec - The vector to set as the up direction
     */
    set up(vec: Vector3);
    /**
     * Gets the up vector of the camera.
     *
     * @returns A copy of the up vector
     */
    get up(): Vector3;
    /**
     * Gets the internal up vector.
     *
     * @returns The internal up vector
     */
    get upInner(): Vector3;
    /**
     * Sets the direction vector of the camera and automatically adjusts the up vector to remain orthogonal.
     *
     * @param vec - The new direction vector for the camera
     */
    set direction(vec: Vector3);
    /**
     * Sets the internal direction vector.
     *
     * @param vec - The vector to set as the internal direction
     */
    set directionInner(vec: Vector3);
    /**
     * Gets the direction vector of the camera.
     *
     * @returns A copy of the direction vector
     */
    get direction(): Vector3;
    /**
     * Gets the internal direction vector.
     *
     * @returns The internal direction vector
     */
    get directionInner(): Vector3;
    /**
     * Sets the corner parameters (left, right, top, bottom) for frustum camera.
     *
     * @param vec - The corner vector (x: left, y: right, z: top, w: bottom)
     */
    set corner(vec: Vector4);
    /**
     * Gets the corner parameters.
     *
     * @returns A copy of the corner vector
     */
    get corner(): Vector4;
    /**
     * Sets the left clipping plane position.
     *
     * @param value - The left clipping plane position
     */
    set left(value: number);
    /**
     * Sets the internal left clipping plane position.
     *
     * @param value - The internal left clipping plane position
     */
    set leftInner(value: number);
    /**
     * Gets the left clipping plane position.
     *
     * @returns The left clipping plane position
     */
    get left(): number;
    /**
     * Sets the right clipping plane position.
     *
     * @param value - The right clipping plane position
     */
    set right(value: number);
    /**
     * Sets the internal right clipping plane position.
     *
     * @param value - The internal right clipping plane position
     */
    set rightInner(value: number);
    /**
     * Gets the right clipping plane position.
     *
     * @returns The right clipping plane position
     */
    get right(): number;
    /**
     * Sets the top clipping plane position.
     *
     * @param value - The top clipping plane position
     */
    set top(value: number);
    /**
     * Sets the internal top clipping plane position.
     *
     * @param value - The internal top clipping plane position
     */
    set topInner(value: number);
    /**
     * Gets the top clipping plane position.
     *
     * @returns The top clipping plane position
     */
    get top(): number;
    /**
     * Sets the bottom clipping plane position.
     *
     * @param value - The bottom clipping plane position
     */
    set bottom(value: number);
    /**
     * Sets the internal bottom clipping plane position.
     *
     * @param value - The internal bottom clipping plane position
     */
    set bottomInner(value: number);
    /**
     * Gets the bottom clipping plane position.
     *
     * @returns The bottom clipping plane position
     */
    get bottom(): number;
    /**
     * Sets the internal corner parameters.
     *
     * @param vec - The internal corner vector
     */
    set cornerInner(vec: Vector4);
    /**
     * Gets the internal corner parameters.
     *
     * @returns The internal corner vector
     */
    get cornerInner(): Vector4;
    /**
     * Sets the internal camera parameters.
     *
     * @param vec - The internal parameters vector
     */
    set parametersInner(vec: Vector4);
    /**
     * Gets the internal camera parameters.
     *
     * @returns The internal parameters vector
     */
    get parametersInner(): Vector4;
    /**
     * Gets the camera parameters.
     *
     * @returns A copy of the parameters vector
     */
    get parameters(): Vector4;
    /**
     * Sets the near clipping plane distance.
     *
     * @param val - The near clipping plane distance
     */
    set zNear(val: number);
    /**
     * Sets the internal near clipping plane distance.
     *
     * @param val - The internal near clipping plane distance
     */
    set zNearInner(val: number);
    /**
     * Gets the internal near clipping plane distance.
     *
     * @returns The internal near clipping plane distance
     */
    get zNearInner(): number;
    /**
     * Gets the near clipping plane distance.
     *
     * @returns The near clipping plane distance
     */
    get zNear(): number;
    /**
     * Sets the focal length and automatically calculates the field of view.
     *
     * @param val - The focal length in millimeters
     */
    set focalLength(val: number);
    /**
     * Gets the focal length.
     *
     * @returns The focal length in millimeters
     */
    get focalLength(): number;
    /**
     * Sets the internal focal length and calculates the field of view.
     *
     * @param val - The internal focal length
     */
    set focalLengthInner(val: number);
    /**
     * Gets the internal focal length.
     *
     * @returns The internal focal length
     */
    get focalLengthInner(): number;
    /**
     * Sets the far clipping plane distance.
     *
     * @param val - The far clipping plane distance
     */
    set zFar(val: number);
    /**
     * Sets the internal far clipping plane distance.
     *
     * @param val - The internal far clipping plane distance
     */
    set zFarInner(val: number);
    /**
     * Gets the internal far clipping plane distance.
     *
     * @returns The internal far clipping plane distance
     */
    get zFarInner(): number;
    /**
     * Gets the far clipping plane distance.
     *
     * @returns The far clipping plane distance
     */
    get zFar(): number;
    /**
     * Sets the field of view and adjusts the film size accordingly.
     *
     * @param degree - The field of view in degrees
     */
    setFovyAndChangeFilmSize(degree: number): void;
    /**
     * Sets the field of view and adjusts the focal length accordingly.
     *
     * @param degree - The field of view in degrees
     */
    setFovyAndChangeFocalLength(degree: number): void;
    /**
     * Gets the field of view.
     *
     * @returns The field of view in degrees
     */
    get fovy(): number;
    /**
     * Sets the internal field of view.
     *
     * @param val - The internal field of view in degrees
     */
    set fovyInner(val: number);
    /**
     * Sets the aspect ratio and adjusts the film width accordingly.
     *
     * @param val - The aspect ratio (width/height)
     */
    set aspect(val: number);
    /**
     * Sets the internal aspect ratio.
     *
     * @param val - The internal aspect ratio
     */
    set aspectInner(val: number);
    /**
     * Gets the internal aspect ratio.
     *
     * @returns The internal aspect ratio
     */
    get aspectInner(): number;
    /**
     * Gets the aspect ratio.
     *
     * @returns The aspect ratio
     */
    get aspect(): number;
    /**
     * Sets the X magnification for orthographic projection.
     *
     * @param val - The X magnification value
     */
    set xMag(val: number);
    /**
     * Gets the X magnification for orthographic projection.
     *
     * @returns The X magnification value
     */
    get xMag(): number;
    /**
     * Sets the Y magnification for orthographic projection.
     *
     * @param val - The Y magnification value
     */
    set yMag(val: number);
    /**
     * Gets the Y magnification for orthographic projection.
     *
     * @returns The Y magnification value
     */
    get yMag(): number;
    /**
     * Gets the component type identifier for camera components.
     *
     * @returns The camera component type identifier
     */
    static get componentTID(): 9;
    /**
     * Gets the component type identifier for this camera component.
     *
     * @returns The camera component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Calculates and returns the projection matrix based on camera parameters.
     *
     * @returns The calculated projection matrix
     */
    calcProjectionMatrix(): MutableMatrix44;
    /**
     * Calculates and returns the view matrix based on camera position and orientation.
     *
     * @returns The calculated view matrix
     */
    calcViewMatrix(): MutableMatrix44;
    /**
     * Gets the view matrix.
     *
     * @returns The view matrix
     */
    get viewMatrix(): Matrix44;
    /**
     * Sets the view matrix.
     *
     * @param viewMatrix - The view matrix to set
     */
    set viewMatrix(viewMatrix: Matrix44);
    /**
     * Gets the projection matrix, considering XR mode if applicable.
     *
     * @returns The projection matrix (may be XR-specific matrix if in XR mode)
     */
    get projectionMatrix(): Matrix44;
    /**
     * Sets the projection matrix.
     *
     * @param projectionMatrix - The projection matrix to set
     */
    set projectionMatrix(projectionMatrix: Matrix44);
    /**
     * Gets the combined view-projection matrix.
     *
     * @returns The view-projection matrix
     */
    get viewProjectionMatrix(): MutableMatrix44;
    /**
     * Gets the bias view-projection matrix for shadow mapping.
     *
     * @returns The bias view-projection matrix adjusted for the current graphics API
     */
    get biasViewProjectionMatrix(): MutableMatrix44;
    /**
     * Sets camera values (position) to the viewPosition member.
     */
    private __setValuesToViewPosition;
    /**
     * Gets the world position of the camera.
     *
     * @returns The world position vector
     */
    get worldPosition(): MutableVector3;
    /**
     * Updates the camera frustum based on current view and projection matrices.
     */
    updateFrustum(): void;
    /**
     * Gets the camera frustum for culling operations.
     *
     * @returns The camera frustum
     */
    get frustum(): Frustum;
    /**
     * Loads the camera component and moves it to the logic stage.
     *
     * @internal
     */
    $load(): void;
    /**
     * Executes the logic update for the camera component.
     * Updates view and projection matrices, handles light synchronization, and manages XR mode.
     *
     * @internal
     */
    $logic(): void;
    /**
     * Gets the entity which has this camera component.
     *
     * @returns The entity which has this component
     */
    get entity(): ICameraEntity;
    /**
     * Adds this camera component to an entity, extending it with camera-specific methods.
     *
     * @param base - The target entity
     * @param _componentClass - The component class to add
     * @returns The entity extended with camera component methods
     * @override
     */
    addThisComponentToEntity<EntityBaseClass extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBaseClass, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBaseClass;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
