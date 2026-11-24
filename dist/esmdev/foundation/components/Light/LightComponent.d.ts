import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type LightTypeEnum } from '../../definitions/LightType';
import type { ILightEntity } from '../../helpers/EntityHelper';
import { MutableVector4 } from '../../math/MutableVector4';
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
    private __type;
    private __color;
    /** The components of the color at the last change, to detect changes of a mutated color object. */
    private __lastColor;
    private __intensity;
    private readonly __initialDirection;
    private __direction;
    private __innerConeAngle;
    private __outerConeAngle;
    private __range;
    private __enable;
    private __shadowAreaSizeForDirectionalLight;
    private __shadowZNearForDirectionalLight;
    private __shadowZNearForSpotLight;
    private __isShadowZNearForSpotLightAuto;
    private __pointLightShadowFarPlane;
    private __shadowCameraOffsetForDirectionalLight;
    castShadow: boolean;
    private _lightPosition;
    private _lightDirection;
    private _lightIntensity;
    private _lightProperty;
    private static __lightNumber;
    private __lightGizmo?;
    /** The shadow slot assigned by a ShadowSystem. `undefined` means the default slot (see `_shadowSlot`). */
    private __shadowSlot;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformUpdateCount;
    private __lastRangeScale;
    /** The number of changes of all light components, per engine. */
    private static __updateCountMap;
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
     * Gets the number of changes of all light components of the engine (creation, destruction and property changes).
     * The engine and the rendering strategies use it to process and upload the light data only when it changed.
     *
     * @param engine - The engine instance
     * @returns The update count
     */
    static getUpdateCount(engine: Engine): number;
    private static __incrementUpdateCount;
    /**
     * Cleans up the static data of the engine.
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
    /**
     * Records a change of a property, so that the light data is recomputed and uploaded.
     */
    private __markUpdated;
    /**
     * Gets the type of the light.
     */
    get type(): LightTypeEnum;
    /**
     * Sets the type of the light.
     */
    set type(value: LightTypeEnum);
    /**
     * Gets whether the light is enabled.
     */
    get enable(): boolean;
    /**
     * Sets whether the light is enabled. A disabled light does not light anything.
     */
    set enable(value: boolean);
    /**
     * Gets the inner cone angle of the spot light (in radian).
     */
    get innerConeAngle(): number;
    /**
     * Sets the inner cone angle of the spot light (in radian).
     */
    set innerConeAngle(value: number);
    /**
     * Gets the outer cone angle of the spot light (in radian).
     */
    get outerConeAngle(): number;
    /**
     * Sets the outer cone angle of the spot light (in radian).
     */
    set outerConeAngle(value: number);
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
     * Sets the zNear value of the SpotLight shadow camera.
     *
     * @remarks
     * A larger zNear makes the perspective depth of the shadow map more linear, which
     * improves the contrast of variance shadow maps. It must stay below the distance
     * from the light to the nearest shadow caster, or that caster is clipped.
     * Setting this property disables the automatic fitting of `ShadowSystem`
     * (`isShadowZNearForSpotLightAuto` becomes false).
     * Updating this property increments updateCount so the camera sync is refreshed.
     */
    set shadowZNearForSpotLight(value: number);
    /**
     * Gets the zNear value used for SpotLight shadow camera.
     */
    get shadowZNearForSpotLight(): number;
    /**
     * Sets the far plane of the paraboloid shadow map of this PointLight.
     *
     * @remarks
     * The far plane normalizes the stored depth. A smaller value keeps the blurred
     * background out of the shadow moments, but receivers farther than the far plane
     * cannot be shaded correctly. -1 (the default) fits it automatically: the light's
     * effective range when available, otherwise the farthest shadow receiver in the scene.
     * Updating this property increments updateCount.
     */
    set pointLightShadowFarPlane(value: number);
    /**
     * Gets the explicit far plane of the PointLight shadow map (-1: automatic).
     */
    get pointLightShadowFarPlane(): number;
    /**
     * Whether the SpotLight shadow camera zNear is fitted automatically from the
     * distance to the nearest shadow caster.
     */
    get isShadowZNearForSpotLightAuto(): boolean;
    /**
     * Sets the automatically fitted zNear value. Does nothing when the user set
     * `shadowZNearForSpotLight` explicitly.
     * @internal
     */
    _setShadowZNearForSpotLightAuto(value: number): void;
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
     * The index of the shadow data of this light in the per-material shadow arrays
     * (`depthTextureIndexList` and `depthBiasPV`), or -1 when the light has no shadow data.
     *
     * @remarks
     * A ShadowSystem assigns the slots of the lights it manages. Otherwise the slot is the component SID
     * when it is below `Config.maxLightNumber`, which is the convention of manual shadow map setups.
     *
     * @internal
     */
    get _shadowSlot(): number;
    /**
     * Sets the shadow slot of this light. `undefined` restores the default slot.
     *
     * @internal
     */
    set _shadowSlot(slot: number | undefined);
    /**
     * The world position of the light as uploaded to the GPU (updated in $logic).
     *
     * @internal
     */
    get _lightPositionForGpu(): MutableVector4;
    /**
     * The world direction of the light as uploaded to the GPU (updated in $logic).
     *
     * @internal
     */
    get _lightDirectionForGpu(): MutableVector4;
    /**
     * The light property (type, effective range, cos of the inner and outer cone angles) as uploaded to the GPU
     * (updated in $logic).
     *
     * @internal
     */
    get _lightPropertyForGpu(): MutableVector4;
    /**
     * The intensity of the light (color * intensity) as uploaded to the GPU (updated in $logic).
     *
     * @internal
     */
    get _lightIntensityForGpu(): MutableVector4;
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
     * Returns the intensity factor that compensates the shortened range. The factors are the measured brightness
     * balance of the Sponza scene: 0.9 -> 1.16 and 0.8 -> 1.35. Values in between interpolate; below 0.8 the last
     * slope continues. A constant factor compensates the range window approximately, not exactly.
     */
    private static __getIntensityScale;
    /**
     * Returns the range used for shading. Point and spot lights without a range get an automatic range
     * when `Config.lightAutoRangeThreshold` is greater than 0.
     */
    private __getEffectiveRange;
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
