import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { ILightEntity } from '../../helpers/EntityHelper';
import { Vector3 } from '../../math/Vector3';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * The Component that represents a light.
 *
 * @remarks
 * the light looks towards the local -Z axis in right hand coordinate system.
 */
export declare class LightComponent extends Component {
    type: import("../..").EnumIO;
    private __color;
    private __intensity;
    private readonly __initialDirection;
    private __direction;
    innerConeAngle: number;
    outerConeAngle: number;
    private __range;
    enable: boolean;
    private __shadowAreaSizeForDirectionalLight;
    private __shadowZNearForDirectionalLight;
    private __shadowCameraOffsetForDirectionalLight;
    castShadow: boolean;
    private _lightPosition;
    private _lightDirection;
    private _lightIntensity;
    private _lightProperty;
    private static __lightNumber;
    private __lightGizmo?;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformUpdateCount;
    /**
     * Creates a new LightComponent instance.
     *
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component system identifier
     * @param entityRepository - The entity repository instance
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for LightComponent.
     *
     * @returns The component type identifier
     */
    static get componentTID(): 7;
    /**
     * Gets the component type identifier for this instance.
     *
     * @returns The component type identifier
     */
    get componentTID(): ComponentTID;
    /**
     * Gets the current update count of this light component.
     * The update count is incremented whenever the light properties change.
     *
     * @returns The current update count
     */
    get updateCount(): number;
    /**
     * Gets the current direction vector of the light.
     * This direction is calculated based on the transform component's rotation.
     *
     * @returns The normalized direction vector
     */
    get direction(): Vector3;
    /**
     * Sets the intensity of the light.
     *
     * @param value - The intensity value (typically 0.0 to 1.0, but can be higher for HDR)
     */
    set intensity(value: number);
    /**
     * Gets the intensity of the light.
     *
     * @returns The current intensity value
     */
    get intensity(): number;
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
    set range(value: number);
    /**
     * Gets the effective range of the light.
     */
    get range(): number;
    /**
     * Sets the orthographic half-size used for DirectionalLight shadow camera.
     *
     * @remarks
     * CameraComponent syncs to light each frame and uses this to set orthographic extents.
     * Updating this property increments updateCount so camera sync is refreshed.
     */
    set shadowAreaSizeForDirectionalLight(value: number);
    /**
     * Gets the orthographic half-size used for DirectionalLight shadow camera.
     */
    get shadowAreaSizeForDirectionalLight(): number;
    /**
     * Sets the zNear value used for DirectionalLight shadow camera.
     *
     * @remarks
     * CameraComponent syncs to light each frame and uses this to set zNear.
     * Updating this property increments updateCount so camera sync is refreshed.
     */
    set shadowZNearForDirectionalLight(value: number);
    /**
     * Gets the zNear value used for DirectionalLight shadow camera.
     */
    get shadowZNearForDirectionalLight(): number;
    /**
     * Sets the shadow camera offset for DirectionalLight.
     * This offset is applied to position the shadow camera at the scene center.
     */
    set shadowCameraOffsetForDirectionalLight(value: Vector3);
    /**
     * Gets the shadow camera offset for DirectionalLight.
     */
    get shadowCameraOffsetForDirectionalLight(): Vector3;
    /**
     * Sets the color of the light.
     *
     * @param value - The RGB color vector (values typically 0.0 to 1.0)
     */
    set color(value: Vector3);
    /**
     * Gets the color of the light.
     *
     * @returns The RGB color vector
     */
    get color(): Vector3;
    /**
     * Gets the up vector for the light in local space.
     * This is used for light orientation calculations.
     *
     * @returns The up vector (0, 1, 0)
     */
    get _up(): Vector3;
    /**
     * Sets the visibility of the light gizmo in the editor.
     * When enabled, creates and shows a visual representation of the light.
     *
     * @param flg - True to show the gizmo, false to hide it
     */
    set isLightGizmoVisible(flg: boolean);
    /**
     * Gets the visibility state of the light gizmo.
     *
     * @returns True if the gizmo is visible, false otherwise
     */
    get isLightGizmoVisible(): boolean;
    /**
     * Initializes the light component by loading global data repositories.
     * This method is called during the component loading phase.
     */
    $load(): void;
    /**
     * Updates the light gizmo if it exists and is visible.
     * This is called internally during the logic update phase.
     *
     * @private
     */
    private __updateGizmo;
    /**
     * Common logic update method that runs once per frame for all light components.
     * Updates the global light count for the shader system.
     *
     * @static
     */
    static common_$logic({ engine }: {
        engine: Engine;
    }): void;
    /**
     * Updates the light component's state and uploads data to the GPU.
     * This method calculates the light direction, position, and properties,
     * then stores them in global data arrays for shader access.
     *
     * @remarks
     * This method implements performance optimization by checking update counts
     * to avoid unnecessary recalculations when nothing has changed.
     */
    $logic(): void;
    /**
     * Cleans up the light component when it's being destroyed.
     * Resets the light intensity values in the global data arrays.
     *
     * @override
     */
    _destroy(): void;
    /**
     * Gets the entity that owns this light component.
     *
     * @returns The light entity instance with light-specific methods
     */
    get entity(): ILightEntity;
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
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
