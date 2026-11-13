import type { CGAPIResourceHandle, ComponentSID, ComponentTID, Count, EntityUID, Index, ObjectUID, PrimitiveUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type ProcessApproachEnum } from '../../definitions/ProcessApproach';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { CubeTexture } from '../../textures/CubeTexture';
import type { RenderTargetTextureCube } from '../../textures/RenderTargetTextureCube';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * Culling result of a render pass for per-instance culling of instanced draw calls.
 * An entity was culled in the render pass while `culledEntityStamp[entityUID] === cullTick`.
 */
export type InstanceCullingState = {
    readonly culledEntityStamp: Uint32Array;
    readonly cullTick: number;
};
/**
 * MeshRendererComponent is a component that manages the rendering of a mesh entity.
 * It handles mesh rendering pipeline, IBL (Image-Based Lighting) cube maps, frustum culling,
 * and rendering optimization through various strategies.
 */
export declare class MeshRendererComponent extends Component {
    private __diffuseCubeMap?;
    private __specularCubeMap?;
    private __sheenCubeMap?;
    private __diffuseCubeMapContribution;
    private __specularCubeMapContribution;
    private __rotationOfCubeMap;
    private static __cgApiRenderingStrategyMap;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    private __updateCount;
    private static __updateCount;
    static _isFrustumCullingEnabled: boolean;
    private __fingerPrint;
    /** Per-render-pass scratch buffers reused by sort_$render to avoid per-frame allocations. */
    private static __sortScratchMap;
    /** Memoized rendering strategy for common_$prerender (the hot path runs once per frame). */
    private static __prerenderStrategyEngineUid;
    private static __prerenderStrategy;
    /**
     * Creates a new MeshRendererComponent instance.
     * @param engine - The engine instance
     * @param entityUid - The unique identifier of the entity this component belongs to
     * @param componentSid - The component's system identifier
     * @param entityRepository - The repository managing entities
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type ID for MeshRendererComponent.
     * @returns The component type ID
     */
    static get componentTID(): 6;
    /**
     * Gets the component type ID for this instance.
     * @returns The component type ID
     */
    get componentTID(): ComponentTID;
    /**
     * Gets the diffuse cube map used for IBL lighting.
     * @returns The diffuse cube map texture or undefined if not set
     */
    get diffuseCubeMap(): CubeTexture | RenderTargetTextureCube | undefined;
    /**
     * Gets the specular cube map used for IBL lighting.
     * @returns The specular cube map texture or undefined if not set
     */
    get specularCubeMap(): CubeTexture | RenderTargetTextureCube | undefined;
    /**
     * Gets the sheen cube map used for IBL lighting.
     * @returns The sheen cube map texture or undefined if not set
     */
    get sheenCubeMap(): CubeTexture | RenderTargetTextureCube | undefined;
    /**
     * Gets the update count for this component instance.
     * @returns The current update count
     */
    get updateCount(): number;
    /**
     * Gets the global update count for all MeshRendererComponent instances.
     * @returns The global update count
     */
    static get updateCount(): number;
    /**
     * Gets the contribution factor for the diffuse cube map in IBL calculations.
     * @returns The diffuse cube map contribution factor (0.0 to 1.0)
     */
    get diffuseCubeMapContribution(): number;
    /**
     * Sets the contribution factor for the diffuse cube map in IBL calculations.
     * @param contribution - The contribution factor (0.0 to 1.0)
     */
    set diffuseCubeMapContribution(contribution: number);
    /**
     * Gets the contribution factor for the specular cube map in IBL calculations.
     * @returns The specular cube map contribution factor (0.0 to 1.0)
     */
    get specularCubeMapContribution(): number;
    /**
     * Sets the contribution factor for the specular cube map in IBL calculations.
     * @param contribution - The contribution factor (0.0 to 1.0)
     */
    set specularCubeMapContribution(contribution: number);
    /**
     * Gets the rotation angle of the cube map in radians.
     * @returns The rotation angle in radians
     */
    get rotationOfCubeMap(): number;
    /**
     * Sets the rotation angle of the cube map in radians.
     * @param rotation - The rotation angle in radians
     */
    set rotationOfCubeMap(rotation: number);
    /**
     * Calculates and updates the fingerprint for this component based on current cube map settings.
     * The fingerprint is used for caching and optimization purposes.
     */
    calcFingerPrint(): void;
    /**
     * Gets the current fingerprint of this component.
     * @returns The fingerprint string
     */
    getFingerPrint(): string;
    /**
     * Sets the IBL (Image-Based Lighting) cube maps for this mesh renderer.
     * @param diffuseCubeTexture - The diffuse cube map texture for IBL
     * @param specularCubeTexture - The specular cube map texture for IBL
     * @param sheenCubeTexture - Optional sheen cube map texture for IBL
     */
    setIBLCubeMap(diffuseCubeTexture: CubeTexture | RenderTargetTextureCube, specularCubeTexture: CubeTexture | RenderTargetTextureCube, sheenCubeTexture?: CubeTexture | RenderTargetTextureCube): void;
    /**
     * Common loading method that initializes the rendering strategy based on the process approach.
     * This method sets up either WebGPU or WebGL rendering strategies.
     * @param processApproach - The graphics API approach to use (WebGPU or WebGL)
     */
    static common_$load({ processApproach, engine }: {
        processApproach: ProcessApproachEnum;
        engine: Engine;
    }): void;
    /**
     * Loads and initializes this mesh renderer component.
     * Sets up the component for rendering by loading the associated mesh.
     */
    $load(): void;
    /**
     * Sorts and filters mesh components for rendering based on camera frustum and material properties.
     * Performs frustum culling and sorts primitives by render order and depth.
     * @param engine - The engine instance
     * @param renderPass - The render pass containing mesh components and rendering context
     * @returns Array of primitive UIDs sorted for optimal rendering
     */
    static sort_$render(engine: Engine, renderPass: RenderPass): ComponentSID[];
    /**
     * Performs frustum culling on mesh components using the camera's view frustum.
     * Filters out mesh components that are not visible from the camera's perspective.
     * @param cameraComponent - The camera component used for frustum culling
     * @param meshComponents - Array of mesh components to be culled
     * @param outPrimitives - Reusable output array. It is cleared and filled with the primitives that passed culling
     * @param scratch - The scratch of the render pass. The entities culled in this pass are stamped into it
     *                  so that instanced draw calls can skip their instances
     * @returns The `outPrimitives` array (same reference) for convenience
     */
    private static __cullingWithViewFrustum;
    /**
     * Culls the instances that share a mesh with the mesh components of the render pass but are not
     * registered in the render pass themselves.
     *
     * Instanced draw calls render every entity sharing a mesh. For example, the VRM outline pass only holds
     * the original model, while its shallow copies are drawn through instancing. Such sibling instances are
     * culled with the camera of this render pass as well, once per mesh. Their visibility flags are left
     * untouched because they belong to the render passes the entities are registered in.
     */
    private static __cullSiblingInstances;
    private static __stampCulledEntity;
    /**
     * Writes `cullTick` into `stamp[entityUID]`, growing the array up to the largest EntityUID seen so far.
     * @returns The stamp array, which is a new array when it has grown
     */
    private static __stampEntity;
    /**
     * Gets the latest culling result of a render pass for per-instance culling of instanced draw calls.
     * The result stays valid while `sort_$render` reuses its cached primitive list for the render pass.
     * @param renderPass - The render pass
     * @returns The culling state, or undefined if no culling has run for the render pass
     * @internal
     */
    static _getInstanceCullingState(renderPass: RenderPass): InstanceCullingState | undefined;
    /**
     * Appends the primitives of a mesh component to `outPrimitives` and computes the
     * view depth for blended primitives.
     */
    private static __appendPrimitivesOfMeshComponent;
    /**
     * Removes duplicated primitives in place without allocating a `Set` or a new array.
     * A primitive UID is unique, so a stamp array indexed by the UID is enough to detect
     * duplicates. `primitives.length` is updated to the deduplicated length.
     */
    private static __removeDuplicatedPrimitives;
    /** Sort comparator shared by every render pass (avoids allocating a closure per frame). */
    private static __comparePrimitives;
    /**
     * Builds the primitive UID list used for drawing. The trailing `-1` is the sentinel
     * that terminates the list.
     */
    private static __createPrimitiveUids;
    /** Returns (and lazily creates) the reusable scratch buffers of a render pass. */
    private static __getSortScratch;
    /**
     * Common pre-rendering setup method that prepares the rendering strategy.
     * Initializes the rendering strategy if not already set and calls its prerender method.
     */
    static common_$prerender(engine: Engine): void;
    /**
     * Common rendering method that executes the actual rendering of primitives.
     * Delegates to the appropriate rendering strategy (WebGL or WebGPU).
     * @param renderPass - The render pass context
     * @param renderPassTickCount - The tick count for this render pass
     * @param primitiveUids - Array of primitive UIDs to render
     * @param displayIdx - The index of the display to render to
     * @param engine - The engine instance
     * @returns True if rendering was successful, false otherwise
     */
    static common_$render({ renderPass, renderPassTickCount, primitiveUids, displayIdx, engine, }: {
        renderPass: RenderPass;
        renderPassTickCount: Count;
        primitiveUids: PrimitiveUID[];
        displayIdx: Index;
        engine: Engine;
    }): boolean;
    /**
     * Instance-specific render method for this mesh renderer component.
     * Currently empty as rendering is handled by the static common_$render method.
     * @param i - The index of this component in the render queue
     * @param renderPass - The render pass context
     * @param renderPassTickCount - The tick count for this render pass
     */
    $render(): void;
    /**
     * Performs a shallow copy of properties from another MeshRendererComponent.
     * Copies cube map settings and contributions without deep cloning the textures.
     * @param component_ - The source component to copy from
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Destroys this component and cleans up its resources.
     * Clears cube map references and calls the parent destroy method.
     */
    _destroy(): void;
    /**
     * Adds the MeshRenderer component functionality to an entity class.
     * This method extends the entity base class with mesh renderer specific methods.
     * @param base - The target entity base class
     * @param _componentClass - The component class to add (unused parameter for type safety)
     * @returns The enhanced entity class with mesh renderer methods
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    /**
     * Cleans up static resources associated with the specified engine.
     * @param engine - The engine instance to clean up resources for
     * @internal
     */
    static _cleanupForEngine(engine: Engine): void;
}
