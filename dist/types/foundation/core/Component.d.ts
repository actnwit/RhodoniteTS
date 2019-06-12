import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import Accessor from '../memory/Accessor';
import { BufferUseEnum } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import ComponentRepository from './ComponentRepository';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import RenderPass from '../renderer/RenderPass';
/**
 * Component is a functional unit that can be added to an Entity instance.
 */
export default class Component {
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
    private __isAlive;
    protected __entityUid: EntityUID;
    protected __memoryManager: MemoryManager;
    protected __entityRepository: EntityRepository;
    /**
     * The constructor of the Component class.
     * When creating an Component, use the createComponent method of the ComponentRepository class
     * instead of directly calling this constructor.
     * @param entityUid Unique ID of the corresponding entity
     * @param componentSid Scoped ID of the Component
     * @param entityRepository The instance of the EntityRepository class (Dependency Injection)
     */
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
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
     * Get the unique ID of the entity corresponding to the component
     */
    readonly entityUID: number;
    readonly currentProcessStage: ProcessStageEnum;
    static isExistProcessStageMethod(componentType: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository): boolean;
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    /**
     * Process the components
     * @param param0 params
     */
    static process({ componentType, processStage, processApproach, componentRepository, strategy, renderPass }: {
        componentType: typeof Component;
        processStage: ProcessStageEnum;
        processApproach: ProcessApproachEnum;
        componentRepository: ComponentRepository;
        strategy: WebGLStrategy;
        renderPass: RenderPass;
    }): void;
    static updateComponentsOfEachProcessStage(componentClass: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository, renderPass: RenderPass): void;
    static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function): number;
    static setupBufferView(): void;
    registerDependency(component: Component, isMust: boolean): void;
    static takeBufferView(bufferUse: BufferUseEnum, componentClass: Function, byteLengthSumOfMembers: Byte, count: Count): void;
    takeOne(memberName: string, dataClassType: any, initValues: number[]): any;
    static getAccessor(memberName: string, componentClass: Function): Accessor;
    static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count): void;
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
    submitToAllocation(count?: Count): void;
    readonly entity: import("./Entity").default;
}
