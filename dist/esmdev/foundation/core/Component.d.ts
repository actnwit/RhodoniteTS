import { MemoryManager } from '../core/MemoryManager';
import { EntityRepository } from './EntityRepository';
import { Accessor } from '../memory/Accessor';
import { BufferUseEnum } from '../definitions/BufferUse';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import { RenderPass } from '../renderer/RenderPass';
import { RnObject } from './RnObject';
import { EntityUID, ComponentSID, Count, Byte } from '../../types/CommonTypes';
import { IEntity } from './Entity';
import { ComponentToComponentMethods } from '../components/ComponentTypes';
import { Result } from '../misc/Result';
/**
 * Component is a functional unit that can be added to an Entity instance.
 */
export declare class Component extends RnObject {
    private _component_sid;
    _isAlive: boolean;
    protected __currentProcessStage: ProcessStageEnum;
    private static __bufferViews;
    private static __accessors;
    private static __byteLengthSumOfMembers;
    private static __memberInfo;
    private static __members;
    private __byteOffsetOfThisComponent;
    /** the entity unique Id which this component belongs to  */
    protected __entityUid: EntityUID;
    /** the instance of MemoryManager */
    protected __memoryManager: MemoryManager;
    /** the instance of EntityRepository */
    protected __entityRepository: EntityRepository;
    /** the MaxComponent Number of entities */
    private __maxComponentNumber;
    static readonly _processStages: Array<ProcessStageEnum>;
    /**
     * The constructor of the Component class.
     * When creating an Component, use the createComponent method of the ComponentRepository class
     * instead of directly calling this constructor.
     * @param entityUid Unique ID of the corresponding entity
     * @param componentSid Scoped ID of the Component
     * @param entityRepository The instance of the EntityRepository class (Dependency Injection)
     */
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Move to the other stages of process
     * @param processStage stage of component's process
     */
    moveStageTo(processStage: ProcessStageEnum): void;
    /**
     * @internal
     * set the Max number of components
     * this method is called by the ***Component classes only
     */
    _setMaxNumberOfComponent(value: number): void;
    /**
     * Get the max number of components
     */
    get maxNumberOfComponent(): number;
    /**
     * Get the Type ID of the Component
     */
    static get componentTID(): number;
    /**
     * Get the Type ID of the Component
     */
    get componentTID(): number;
    /**
     * Get the Scoped ID of the Component
     */
    get componentSID(): number;
    /**
     * Get the unique ID of the entity corresponding to the component.
     */
    get entityUID(): number;
    /**
     * Get the current process stage of the component.
     */
    get currentProcessStage(): ProcessStageEnum;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     * @returns true or false
     */
    static doesTheProcessStageMethodExist(componentType: typeof Component, processStage: ProcessStageEnum): boolean;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     */
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    /**
     * Process the components
     * @param param0 params
     */
    static process(componentType: typeof Component, processStage: ProcessStageEnum): void;
    static updateComponentsForRenderStage(componentClass: typeof Component, processStage: ProcessStageEnum, renderPass: RenderPass): any;
    /**
     * get byte length of sum of member fields in the component class
     */
    static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function): number;
    /**
     * register a dependency for the other components.
     * Note: This method is not used yet
     */
    registerDependency(component: Component, isMust: boolean): void;
    /**
     * take one memory area for the specified member for all same type of the component instances.
     */
    takeOne(memberName: string, dataClassType: any, initValues: number[], isReUse: boolean, componentSid: ComponentSID): any;
    /**
     * get the taken accessor for the member field.
     */
    static getAccessor(memberName: string, componentClass: Function): Accessor;
    /**
     * take one accessor for the member field.
     */
    static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count): Result<Accessor, undefined>;
    static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass: Function): Byte;
    /**
     * Register a member field of component class for memory allocation.
     * @param bufferUse purpose type of buffer use
     * @param memberName the name of member field
     * @param dataClassType a class of data
     * @param componentType a type of number
     * @param initValues a initial value
     */
    registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType: unknown, componentType: ComponentTypeEnum, initValues: number[]): void;
    /**
     * Allocate memory of self member fields
     * @param count a number of entities to need allocate
     */
    submitToAllocation(count: Count, isReUse: boolean): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IEntity;
    /**
     * get the bytes Information of the member
     * @param component a instance of the component
     * @param memberName the member of component in string
     * @returns bytes information
     */
    static getDataByteInfoInner(component: Component, memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    };
    /**
     * get the bytes Information of the member
     * @param memberName the member of component in string
     * @returns bytes information
     */
    getDataByteInfo(memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    };
    /**
     * get the bytes Information of the member (static version) by ComponentSID
     * @param componentType the Component type
     * @param componentSID the ComponentSID of the component
     * @param memberName the member of component in string
     * @returns bytes information
     */
    static getDataByteInfoByComponentSID(componentType: typeof Component, componentSID: ComponentSID, memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    } | undefined;
    /**
     * get the bytes Information of the member (static version) by EntityUID
     * @param componentType the component type
     * @param entityUID the EntityUID
     * @param memberName the member of component in string
     * @returns bytes information
     */
    /**
     * get the Pixel Location Offset in the Buffer of the Member
     * @param componentType the component type (e.g. TransformComponent )
     * @param memberName the member name in string
     * @returns the pixel offsets
     */
    static getLocationOffsetOfMemberOfComponent(componentType: typeof Component, memberName: string): number;
    /**
     * @virtual
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): EntityBase & ComponentToComponentMethods<SomeComponentClass>;
    /**
     * Get the CompositionType of the member
     * @param memberName - the member name
     * @param componentClass - the component class
     * @returns CompositionType or undefined
     */
    static getCompositionTypeOfMember(memberName: string, componentClass: Function): CompositionTypeEnum | undefined;
    /**
     * Get the ComponentType of the member
     * @param memberName - the member name
     * @param componentClass - the component class
     * @returns ComponentType or undefined
     */
    static getComponentTypeOfMember(memberName: string, componentClass: Function): ComponentTypeEnum | undefined;
    /**
     * @internal
     * Mark the component as destroyed
     */
    _destroy(): void;
    _shallowCopyFrom(component: Component): void;
}
