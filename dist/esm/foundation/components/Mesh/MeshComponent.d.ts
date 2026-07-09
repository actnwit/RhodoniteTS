import type { ComponentTID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import type { Mesh } from '../../geometry/Mesh';
import type { RaycastResultEx1 } from '../../geometry/types/GeometryTypes';
import type { IMeshEntity } from '../../helpers/EntityHelper';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * MeshComponent is a component that manages a mesh geometry for an entity.
 * It provides functionality for mesh management, ray casting, depth calculation,
 * and vertex data updates for 3D rendering.
 */
export declare class MeshComponent extends Component {
    private __viewDepth;
    private __mesh?;
    isPickable: boolean;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __returnVector3;
    private static __tmpMatrix44_0;
    private static __latestPrimitivePositionAccessorVersion;
    /**
     * Gets the component type identifier for MeshComponent.
     * @returns The component type ID for mesh components
     */
    static get componentTID(): 5;
    /**
     * Gets the component type identifier for this instance.
     * @returns The component type ID for mesh components
     */
    get componentTID(): ComponentTID;
    /**
     * Associates a mesh with this component.
     * @param mesh - The mesh to be assigned to this component
     */
    setMesh(mesh: Mesh): void;
    /**
     * Removes the mesh association from this component.
     * @returns True if a mesh was successfully unset, false if no mesh was set
     */
    unsetMesh(): boolean;
    /**
     * Gets the mesh associated with this component.
     * @returns The mesh instance, or undefined if no mesh is set
     */
    get mesh(): Mesh | undefined;
    /**
     * Calculates the view depth of the mesh center from the given camera's perspective.
     * This is used for depth sorting and rendering order determination.
     * @param cameraComponent - The camera component to calculate depth from
     * @returns The depth value in view space (negative Z value), or Number.MAX_VALUE if no mesh is set
     */
    calcViewDepth(cameraComponent: CameraComponent): number;
    /**
     * Gets the cached view depth value.
     * @returns The current view depth value
     */
    get viewDepth(): number;
    /**
     * Logs a debug message when no mesh is set on a MeshComponent.
     * @param meshComponent - The mesh component instance to log about
     */
    static alertNoMeshSet(meshComponent: MeshComponent): void;
    /**
     * Performs ray casting against the mesh geometry in world space.
     * @param srcPointInWorld - The ray origin point in world coordinates
     * @param directionInWorld - The ray direction vector in world coordinates
     * @param dotThreshold - The dot product threshold for face culling (default: 0)
     * @returns Ray casting result with intersection information
     */
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number): RaycastResultEx1;
    /**
     * Performs ray casting from screen coordinates against the mesh in local space.
     * @param x - The X coordinate in screen space
     * @param y - The Y coordinate in screen space
     * @param camera - The camera component for projection calculations
     * @param viewport - The viewport dimensions as Vector4 (x, y, width, height)
     * @param dotThreshold - The dot product threshold for face culling (default: 0)
     * @returns Ray casting result with intersection information in local space
     */
    castRayFromScreenInLocal(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    /**
     * Performs ray casting from screen coordinates against the mesh in world space.
     * @param x - The X coordinate in screen space
     * @param y - The Y coordinate in screen space
     * @param camera - The camera component for projection calculations
     * @param viewport - The viewport dimensions as Vector4 (x, y, width, height)
     * @param dotThreshold - The dot product threshold for face culling (default: 0)
     * @returns Ray casting result with intersection information in world space
     */
    castRayFromScreenInWorld(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    /**
     * Loads and initializes the mesh data, performing necessary calculations.
     * This method calculates tangents, face normals, and barycentric coordinates
     * if blend shapes are present, then moves to the Logic processing stage.
     */
    $load(): void;
    /**
     * Updates the 3D API vertex data by recreating VBO and VAO.
     * This is called internally when vertex data needs to be refreshed.
     * @private
     */
    private __update3DAPIVertexData;
    /**
     * Calculates barycentric coordinates for all mesh primitives.
     * This converts indexed geometry to unindexed geometry and updates
     * the 3D API vertex data afterwards.
     */
    calcBaryCentricCoord(): void;
    /**
     * Logic processing stage method. Currently empty but can be overridden
     * for custom logic processing during the component's lifecycle.
     */
    $logic(): void;
    /**
     * Performs a shallow copy of data from another MeshComponent.
     * @param component_ - The source component to copy from
     * @protected
     */
    _shallowCopyFrom(component_: Component): void;
    /**
     * Destroys the component and cleans up resources.
     * Properly releases GPU resources to prevent memory leaks and display corruption.
     * @protected
     */
    _destroy(): void;
    /**
     * Gets the entity which has this component with proper typing.
     * @returns The entity which has this component as an IMeshEntity
     */
    get entity(): IMeshEntity;
    /**
     * Adds this component to an entity by extending the entity class with mesh-specific methods.
     * This method applies mixins to add getMesh() method to the target entity.
     * @param base - The target entity to extend
     * @param _componentClass - The component class to add (not used but required by interface)
     * @returns The extended entity with mesh component methods
     * @template EntityBase - The base entity type
     * @template SomeComponentClass - The component class type
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
