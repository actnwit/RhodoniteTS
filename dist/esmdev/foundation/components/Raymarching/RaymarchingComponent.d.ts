import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { NodeJSON } from '../../../types/NodeJSON';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type SdfShapeTypeEnum } from '../../definitions/SdfShapeType';
import { AABB } from '../../math/AABB';
import type { IVector3 } from '../../math/IVector';
import { Vector3 } from '../../math/Vector3';
import type { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { ShapeComponent } from '../Shape/ShapeComponent';
import { type RaymarchingRaycastHit, type RaymarchingRaycastOptions, type RaymarchingUniformValueProvider } from './RaymarchingSdfEvaluator';
/**
 * Options for creating a box shape from the SDF bounds.
 */
export type RaymarchingAabbShapeOptions = {
    /** Local-space AABB to use instead of the one computed from the SDF graph. */
    aabb?: AABB;
    /** ShapeComponent that receives the box. Defaults to the entity's ShapeComponent. */
    shapeComponent?: ShapeComponent;
    /** Origin expressed in the same local space as the AABB. */
    origin?: IVector3;
};
/**
 * A sphere collider extracted from a single-sphere SDF graph.
 */
export type RaymarchingSphereCollider = {
    /** Sphere center in the component entity's local space. */
    center: Vector3;
    /** Sphere radius in the component entity's local space. */
    radius: number;
};
/**
 * Options for creating a collider shape from the SDF.
 */
export type RaymarchingColliderShapeOptions = {
    /** Local-space AABB to use for the box fallback. */
    aabb?: AABB;
    /** ShapeComponent that receives the shape. Defaults to the entity's ShapeComponent. */
    shapeComponent?: ShapeComponent;
    /** Origin expressed in the same local space as the AABB (box fallback only). */
    origin?: IVector3;
};
/**
 * A collider shape descriptor computed from an SDF graph.
 */
export type RaymarchingColliderShapeDescriptor = {
    shapeType: 'sphere';
    center: Vector3;
    radius: number;
} | {
    shapeType: 'box';
    aabb: AABB;
};
/**
 * The collider shape created from an SDF graph.
 */
export type RaymarchingColliderShapeResult = {
    shapeIndex: number;
    shapeType: 'sphere';
    center: Vector3;
    radius: number;
} | {
    shapeIndex: number;
    shapeType: 'box';
    aabb: AABB;
};
/**
 * RaymarchingComponent is a component that manages raymarching for an entity.
 * This component handles the raymarching of the entity.
 */
export declare class RaymarchingComponent extends Component {
    private __rrnJson;
    private __sdSphereNodeJson;
    private __sdBoxNodeJson;
    private __sdTorusNodeJson;
    private __sdCapsuleNodeJson;
    private __sdRoundBoxNodeJson;
    private __rrnJsonTemplate;
    private __sdfShapeType;
    private __uniformValueProvider?;
    private __generatedColliderShapeIndices;
    /**
     * Whether this raymarching component participates in ray casting.
     */
    isPickable: boolean;
    /**
     * Whether the SDF of this raymarching component is rendered into the shadow maps.
     * Casting components are merged into the shadow caster material; non-casting ones are
     * left out so they do not occlude casting SDFs behind them.
     */
    castShadow: boolean;
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for RaymarchingComponent.
     * @returns The component type ID for RaymarchingComponent
     */
    static get componentTID(): 16;
    /**
     * Gets the component type identifier for this RaymarchingComponent instance.
     * @returns The component type ID for RaymarchingComponent
     */
    get componentTID(): ComponentTID;
    static common_$render(): boolean;
    /**
     * Sets the RRN JSON data for the RaymarchingComponent.
     * @param rrnJson - The RRN JSON data
     */
    set rrnJson(rrnJson: NodeJSON);
    /**
     * Gets the RRN JSON data for the RaymarchingComponent.
     * @returns The RRN JSON data
     */
    get rrnJson(): NodeJSON;
    /**
     * Gets the SDF shape type for the RaymarchingComponent.
     * @returns The SDF shape type
     */
    get sdfShapeType(): SdfShapeTypeEnum;
    /**
     * Sets the SDF shape type for the RaymarchingComponent.
     * @param sdfShapeType - The SDF shape type
     */
    set sdfShapeType(sdfShapeType: SdfShapeTypeEnum);
    /**
     * Returns the preset SDF node JSON that replaces the template's placeholder node.
     * Custom (a graph authored in the node editor) has no preset node.
     */
    private __getPresetSdfNodeJson;
    /**
     * Resolves a material parameter used by a Uniform shader node.
     * Set this when the raymarching material changes uniform values at runtime.
     */
    get uniformValueProvider(): RaymarchingUniformValueProvider | undefined;
    set uniformValueProvider(provider: RaymarchingUniformValueProvider | undefined);
    /**
     * Invalidates the cached scene graph AABB so the merged AABB is recomputed.
     */
    invalidateAABB(): void;
    /**
     * A version that changes whenever any raymarching component's AABB may have changed.
     * The shadow volume auto-fit uses it as part of its cache key.
     */
    static getAABBVersion(engine: Engine): number;
    private static __aabbVersions;
    /**
     * Calculates a conservative world-space AABB of the SDF graph.
     * @returns The world-space bounds, or null when the graph is unbounded
     */
    calcWorldAABB(): AABB | null;
    /**
     * Calculates a conservative AABB in the component entity's local space.
     * This is the space ShapeComponent and PhysicsComponent use.
     * @returns The local-space bounds, or null when the graph is unbounded
     */
    calcLocalAABB(): AABB | null;
    /**
     * Casts a world-space ray against the SDF graph.
     * @param originInWorld - Ray origin in world space
     * @param directionInWorld - Ray direction in world space
     * @param options - Marching options
     * @returns The hit, or undefined when the component is not pickable or missed
     */
    castRay(originInWorld: Vector3, directionInWorld: Vector3, options?: RaymarchingRaycastOptions): RaymarchingRaycastHit | undefined;
    /**
     * Casts a ray from screen coordinates against the SDF graph.
     * @param x - Screen x coordinate
     * @param y - Screen y coordinate
     * @param camera - Camera used to build the world-space ray
     * @param viewport - Viewport rectangle as Vector4 (x, y, width, height)
     * @param options - Marching options
     * @returns The raycast result in world space
     */
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, options?: RaymarchingRaycastOptions): {
        result: boolean;
        data?: RaymarchingRaycastHit;
    };
    /**
     * Returns an exact sphere collider when the graph is a single SdSphere.
     *
     * The result is expressed in the component entity's local space and is only
     * returned when the sphere's position chain contains SdApplyWorldMatrix,
     * which makes the SDF follow the entity transform.
     *
     * @returns The local-space sphere, or null when the graph is not a single
     * transformed sphere
     */
    calcLocalSphereCollider(): RaymarchingSphereCollider | null;
    /**
     * Adds a collider shape for the SDF.
     *
     * Uses an exact sphere when the graph is a single transformed sphere;
     * otherwise falls back to a conservative AABB box.
     *
     * @param options - Shape creation options
     * @returns The created shape information, or undefined when no finite shape exists
     */
    addColliderShape(options?: RaymarchingColliderShapeOptions): RaymarchingColliderShapeResult | undefined;
    /**
     * Recomputes every collider shape previously created by addColliderShape().
     *
     * Shapes are replaced in place so physics bindings keep their shape indices,
     * and the entity's PhysicsComponent is rebuilt when anything changed. When the
     * SDF no longer has a finite collider shape, the generated shapes and their
     * bindings are removed.
     *
     * @returns The number of collider shapes that were updated or removed
     */
    updateColliderShapes(): number;
    private __calcColliderShape;
    private __trackGeneratedColliderShape;
    private static __shapeMatchesDescriptor;
    /**
     * Adds a box shape fitted to the SDF bounds to a ShapeComponent.
     * The shape can then be bound to a PhysicsComponent as a collider.
     * @param options - Shape creation options
     * @returns The new shape index, or undefined when no finite bounds exist
     */
    addAabbBoxShape(options?: RaymarchingAabbShapeOptions): number | undefined;
    private __getOrCreateShapeComponent;
    /**
     * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
     * @param component - The source component to copy from
     * @protected
     */
    _shallowCopyFrom(component: Component): void;
    /**
     * Destroys this RaymarchingComponent and cleans up resources.
     * @protected
     */
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
