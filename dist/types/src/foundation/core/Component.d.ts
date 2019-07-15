import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { BufferUseEnum } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import ComponentRepository from './ComponentRepository';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import RenderPass from '../renderer/RenderPass';
import RnObject from './RnObject';
/**
 * Component is a functional unit that can be added to an Entity instance.
 */
export default class Component extends RnObject {
    private _component_sid;
    static readonly invalidComponentSID = -1;
    protected __currentProcessStage: ProcessStageEnum;
    protected static __componentsOfProcessStages: Map<ProcessStageEnum, Int32Array>;
    protected static __lengthOfArrayOfProcessStages: Map<ProcessStageEnum, number>;
    protected static __dirtyOfArrayOfProcessStages: Map<ProcessStageEnum, boolean>;
    private static __bufferViews;
    private static __accessors;
    private static __byteLengthSumOfMembers;
    private static __memberInfo;
    private static __members;
    private __byteOffsetOfThisComponent;
    private __isAlive;
    protected __entityUid: EntityUID;
    protected __memoryManager: MemoryManager;
    protected __entityRepository: EntityRepository;
    private __maxComponentNumber;
    /**
     * The constructor of the Component class.
     * When creating an Component, use the createComponent method of the ComponentRepository class
     * instead of directly calling this constructor.
     * @param entityUid Unique ID of the corresponding entity
     * @param componentSid Scoped ID of the Component
     * @param entityRepository The instance of the EntityRepository class (Dependency Injection)
     */
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    maxNumberOfComponent: number;
    /**
     * Move to the other stages of process
     * @param processStage stage of component's process
     */
    moveStageTo(processStage: ProcessStageEnum): void;
    /**
     * Get the Type ID of the Component
     */
    static readonly componentTID: number;
    /**
     * Get the Scoped ID of the Component
     */
    readonly componentSID: number;
    /**
     * Get the unique ID of the entity corresponding to the component.
     */
    readonly entityUID: number;
    /**
     * Get the current process stage of the component.
     */
    readonly currentProcessStage: ProcessStageEnum;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     */
    static isExistProcessStageMethod(componentType: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository): boolean;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     */
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    /**
     * Process the components
     * @param param0 params
     */
    static process({ componentType, processStage, processApproach, componentRepository, strategy, renderPass, renderPassTickCount }: {
        componentType: typeof Component;
        processStage: ProcessStageEnum;
        processApproach: ProcessApproachEnum;
        componentRepository: ComponentRepository;
        strategy: WebGLStrategy;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
    /**
     * Update all components at each process stage.
     */
    static updateComponentsOfEachProcessStage(componentClass: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository, renderPass: RenderPass): void;
    /**
     * get byte length of sum of member fields in the component class
     */
    static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function): number;
    static setupBufferView(): void;
    /**
     * register a dependency for the other components.
     */
    registerDependency(component: Component, isMust: boolean): void;
    /**
     * take a buffer view from the buffer.
     */
    static takeBufferView(bufferUse: BufferUseEnum, componentClass: Function, byteLengthSumOfMembers: Byte, count: Count): BufferView | undefined;
    /**
     * take one memory area for the specified member for all same type of the component instances.
     */
    takeOne(memberName: string, dataClassType: any, initValues: number[]): any;
    /**
     * get the taken accessor for the member field.
     */
    static getAccessor(memberName: string, componentClass: Function): Accessor;
    /**
     * take one accessor for the member field.
     */
    static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count): import("../memory/AccessorBase").default | undefined;
    static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass: Function): Byte;
    static getCompositionTypeOfMember(memberName: string, componentClass: Function): CompositionTypeEnum | null;
    static getComponentTypeOfMember(memberName: string, componentClass: Function): ComponentTypeEnum | null;
    /**
     * Register a member field of component class for memory allocation.
     * @param bufferUse purpose type of buffer use
     * @param memberName the name of member field
     * @param dataClassType a class of data
     * @param componentType a type of number
     * @param initValues a initial value
     */
    registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType: Function, componentType: ComponentTypeEnum, initValues: number[]): void;
    /**
     * Allocate memory of self member fields
     * @param count a number of entities to need allocate
     */
    submitToAllocation(count: Count): void;
    readonly entity: import("./Entity").default;
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
    static getDataByteInfoByEntityUID(componentType: typeof Component, entityUID: EntityUID, memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    } | undefined;
    static getLocationOffsetOfMemberOfComponent(componentType: typeof Component, memberName: string): number;
}
