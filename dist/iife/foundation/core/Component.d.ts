import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { ComponentSID, Count, EntityUID, IndexOf16Bytes } from '../../types/CommonTypes';
import type { ComponentToComponentMethods } from '../components/ComponentTypes';
import type { MemoryManager } from '../core/MemoryManager';
import type { BufferUseEnum } from '../definitions/BufferUse';
import { type ProcessStageEnum } from '../definitions/ProcessStage';
import type { ShaderTypeEnum } from '../definitions/ShaderType';
import type { MutableMatrix33 } from '../math/MutableMatrix33';
import type { MutableMatrix44 } from '../math/MutableMatrix44';
import type { MutableQuaternion } from '../math/MutableQuaternion';
import type { MutableScalar } from '../math/MutableScalar';
import type { MutableVector3 } from '../math/MutableVector3';
import type { MutableVector4 } from '../math/MutableVector4';
import { VectorN } from '../math/VectorN';
import type { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { ComponentMemoryRegistry } from './ComponentMemoryRegistry';
import type { IEntity } from './Entity';
import type { EntityRepository } from './EntityRepository';
import { RnObject } from './RnObject';
type DataClassType = typeof VectorN | typeof MutableMatrix44 | typeof MutableMatrix33 | typeof MutableVector3 | typeof MutableVector4 | typeof MutableQuaternion | typeof MutableScalar;
export type MemberInfo = {
    memberName: string;
    bufferUse: BufferUseEnum;
    dataClassType: DataClassType;
    shaderType: ShaderTypeEnum;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    initValues: number[] | VectorN;
    convertToBool?: boolean;
};
type MemberName = string;
/**
 * Component is a functional unit that can be added to an Entity instance.
 * This is the base class for all components in the ECS (Entity-Component-System) architecture.
 * Components provide specific functionality and data to entities.
 */
export declare class Component extends RnObject {
    private _component_sid;
    _isAlive: boolean;
    protected __isReUse: boolean;
    protected __engine: Engine;
    protected __currentProcessStage: ProcessStageEnum;
    /**
     * Stores member metadata for each component class.
     * This is class-level static data that doesn't depend on Engine instances.
     */
    private static __memberInfo;
    /**
     * Stores array length information for each component class member.
     * This is class-level static data that doesn't depend on Engine instances.
     */
    private static __arrayLengthMap;
    /** the entity unique Id which this component belongs to  */
    protected __entityUid: EntityUID;
    /** the instance of MemoryManager */
    protected __memoryManager: MemoryManager;
    /** the instance of EntityRepository */
    protected __entityRepository: EntityRepository;
    static readonly _processStages: Array<ProcessStageEnum>;
    /**
     * The constructor of the Component class.
     * When creating a Component, use the createComponent method of the ComponentRepository class
     * instead of directly calling this constructor.
     *
     * @param engine - The engine instance
     * @param entityUid - Unique ID of the corresponding entity
     * @param componentSid - Scoped ID of the Component
     * @param entityRepository - The instance of the EntityRepository class (Dependency Injection)
     * @param isReUse - Whether this component is being reused from a pool
     */
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Transitions the component to a different process stage.
     * This affects which update methods will be called during the frame processing.
     *
     * @param processStage - The target stage to move to
     */
    moveStageTo(processStage: ProcessStageEnum): void;
    /**
     * Gets the Type ID of the Component class.
     * This is overridden by concrete component classes to provide unique type identification.
     *
     * @returns The component type ID (default: 0)
     */
    static get componentTID(): number;
    /**
     * Gets the Type ID of this Component instance.
     * This is overridden by concrete component classes to provide unique type identification.
     *
     * @returns The component type ID (default: 0)
     */
    get componentTID(): number;
    /**
     * Gets the Scoped ID of this Component instance.
     * The SID is unique within the component type and represents the instance index.
     *
     * @returns The component scoped ID
     */
    get componentSID(): number;
    /**
     * Gets the unique ID of the entity that owns this component.
     *
     * @returns The entity unique ID
     */
    get entityUID(): number;
    /**
     * Gets the current process stage of the component.
     * This determines which update methods are currently being called.
     *
     * @returns The current process stage
     */
    get currentProcessStage(): ProcessStageEnum;
    /**
     * Checks whether the specified ProcessStage method exists in the given Component class.
     * This is used to determine if a component can handle a particular process stage.
     *
     * @param componentType - The component class to check
     * @param processStage - The process stage to check for
     * @returns True if the method exists, false otherwise
     */
    static doesTheProcessStageMethodExist(componentType: typeof Component, processStage: ProcessStageEnum): boolean;
    /**
     * Checks whether the specified ProcessStage method exists in this Component instance.
     * This is used to determine if this component can handle a particular process stage.
     *
     * @param processStage - The process stage to check for
     * @returns True if the method exists, false otherwise
     */
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    /**
     * Processes all components of a given type for a specific process stage.
     * This method iterates through all components of the specified type and calls
     * their corresponding process stage method if they are in that stage.
     *
     * @param componentType - The component class to process
     * @param processStage - The process stage to execute
     */
    static process(engine: Engine, componentType: typeof Component, processStage: ProcessStageEnum): void;
    /**
     * Updates components specifically for the render stage with render pass context.
     * This method calls the sort_$render method of the component class to handle
     * render-specific processing and sorting.
     *
     * @param componentClass - The component class to update
     * @param processStage - The render process stage
     * @param renderPass - The current render pass context
     * @returns The result of the sort_$render method
     */
    static updateComponentsForRenderStage(componentClass: typeof Component, _processStage: ProcessStageEnum, renderPass: RenderPass): any;
    /**
     * Registers a dependency relationship with another component.
     * This method is intended for future use in managing component dependencies.
     *
     * @param component - The component to depend on
     * @param isMust - Whether this dependency is required
     * @todo This method is not used yet and needs implementation
     */
    registerDependency(_component: Component, _isMust: boolean): void;
    /**
     * Allocates memory for a specific member field of this component instance.
     * This method takes one memory slot from the shared memory pool for the specified member.
     *
     * @param memberName - The name of the member field
     * @param dataClassType - The data class type for the member
     * @param initValues - Initial values to set for the member
     * @param isReUse - Whether to reuse an existing memory slot
     * @param componentSid - The component scoped ID
     * @param componentCountPerBufferView - The number of components per buffer view
     * @returns null on success
     */
    private __takeOne;
    /**
     * Gets the ComponentMemoryRegistry for this component's engine.
     */
    get _componentMemoryRegistry(): ComponentMemoryRegistry;
    /**
     * Creates and configures a memory accessor for a specific member field.
     * This method allocates buffer memory and creates an accessor for efficient data access.
     *
     * @param engine - The engine instance
     * @param bufferUse - The intended use of the buffer
     * @param memberName - The name of the member field
     * @param componentClass - The component class
     * @param compositionType - The composition type (e.g., Vec3, Mat4)
     * @param componentType - The component data type (e.g., Float32, Int32)
     * @param indexOfTheBufferView - The buffer view index
     * @param componentCountPerBufferView - The number of components per buffer view
     * @param arrayLength - The array length
     * @returns Result containing the accessor or an error
     */
    private static __takeAccessor;
    /**
     * Registers a member field of the component class for memory allocation.
     * This method defines the memory layout and characteristics of component data members.
     *
     * @param bufferUse - The intended purpose/type of buffer use
     * @param memberName - The name of the member field
     * @param dataClassType - The class type of the data
     * @param shaderType - The shader type (e.g., VertexShader, PixelShader)
     * @param componentType - The primitive data type (e.g., Float32, Int32)
     * @param initValues - Initial values for the member field
     * @param convertToBool - Whether to convert the member value to a boolean
     */
    static registerMember(this: typeof Component, { bufferUse, memberName, dataClassType, shaderType, compositionType, componentType, initValues, arrayLength, componentSID, convertToBool, }: {
        bufferUse: BufferUseEnum;
        memberName: string;
        dataClassType: DataClassType;
        shaderType: ShaderTypeEnum;
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        initValues: number[] | VectorN;
        arrayLength?: Count | undefined;
        componentSID?: ComponentSID;
        convertToBool?: boolean;
    }): void;
    /**
     * Allocates memory for all member fields of this component instance.
     * This method is called during component initialization to set up memory layout
     * and allocate space for the specified number of entities.
     *
     * @param componentCountPerBufferView - The number of components per buffer view
     * @param isReUse - Whether to reuse existing memory allocations
     */
    submitToAllocation(componentCountPerBufferView: Count, isReUse: boolean): void;
    /**
     * Gets the entity that owns this component.
     * This provides access to the entity and its other components.
     *
     * @returns The entity instance that owns this component
     */
    get entity(): IEntity;
    /**
     * Gets the pixel location offset in the buffer for a specific member of a component type.
     * This is useful for GPU texture-based data access where locations are measured in pixels.
     *
     * @param engine - The engine instance
     * @param componentType - The component class type
     * @param memberName - The name of the member field
     * @returns The pixel location offset in the buffer
     */
    static getLocationOffsetOfMemberOfComponent(engine: Engine, componentType: typeof Component, memberName: string): IndexOf16Bytes[];
    /**
     * Adds this component to an entity, extending the entity with component-specific methods.
     * This is a virtual method that should be overridden by concrete component classes.
     *
     * @virtual
     * @param base - The target entity to add this component to
     * @param _componentClass - The component class being added
     * @returns The entity extended with component methods
     * @throws Error indicating invalid calling of virtual method
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(_base: EntityBase, _componentClass: SomeComponentClass): EntityBase & ComponentToComponentMethods<SomeComponentClass>;
    /**
     * Gets the CompositionType of a specific member field in a component class.
     * This is useful for understanding the data structure of component members.
     *
     * @param engine - The engine instance
     * @param memberName - The name of the member field
     * @param componentClass - The component class to query
     * @returns The CompositionType of the member or undefined if not found
     */
    static getCompositionTypeOfMember(_engine: Engine, memberName: string, componentClass: typeof Component): CompositionTypeEnum | undefined;
    /**
     * Gets the ComponentType of a specific member field in a component class.
     * This is useful for understanding the primitive data type of component members.
     *
     * @param memberName - The name of the member field
     * @param componentClass - The component class to query
     * @returns The ComponentType of the member or undefined if not found
     */
    static getComponentTypeOfMember(_engine: Engine, memberName: string, componentClass: typeof Component): ComponentTypeEnum | undefined;
    /**
     * Gets the member info of the component.
     * This is useful for getting the member info of the component.
     *
     * @returns The member info of the component
     */
    static getMemberInfo(_engine: Engine): Map<typeof Component, Map<MemberName, MemberInfo>>;
    /**
     * Gets the number of components per buffer view for the component.
     * @returns The number of components per buffer view for the component
     */
    static getComponentCountPerBufferView(engine: Engine): Map<typeof Component, Count>;
    /**
     * Gets the array length of a specific member field in a component class.
     * @returns The array length map of the component
     */
    static getArrayLengthOfMember(_engine: Engine): Map<typeof Component, Map<MemberName, Count>>;
    /**
     * Marks this component as destroyed and no longer alive.
     * This is used internally to manage component lifecycle.
     *
     * @internal
     */
    _destroy(): void;
    /**
     * Performs a shallow copy of data from another component of the same type.
     * This method should be implemented by concrete component classes as needed.
     *
     * @param component - The source component to copy from
     */
    _shallowCopyFrom(_component: Component): void;
    /**
     * Gets the state version of the component memory layout.
     * This is incremented whenever the component's memory layout changes.
     *
     * @param engine - The engine instance
     * @returns The state version number
     */
    static getStateVersion(engine: Engine): number;
}
export {};
