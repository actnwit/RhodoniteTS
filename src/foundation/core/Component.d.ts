import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import Accessor from '../memory/Accessor';
import { BufferUseEnum } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import ComponentRepository from './ComponentRepository';
import WebGLStrategy from '../../webgl/WebGLStrategy';
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
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    moveStageTo(processStage: ProcessStageEnum): void;
    static readonly componentTID: number;
    readonly componentSID: number;
    readonly entityUID: number;
    static isExistProcessStageMethod(componentTid: ComponentTID, processStage: ProcessStageEnum, componentRepository: ComponentRepository): boolean;
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    static process({ componentTid, processStage, instanceIDBufferUid, processApproach, componentRepository, strategy }: {
        componentTid: ComponentTID;
        processStage: ProcessStageEnum;
        instanceIDBufferUid: CGAPIResourceHandle;
        processApproach: ProcessApproachEnum;
        componentRepository: ComponentRepository;
        strategy: WebGLStrategy;
    }): void;
    static updateComponentsOfEachProcessStage(componentTid: ComponentTID, processStage: ProcessStageEnum, componentRepository: ComponentRepository): void;
    static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function): number;
    static setupBufferView(): void;
    registerDependency(component: Component, isMust: boolean): void;
    static takeBufferViewer(bufferUse: BufferUseEnum, componentClass: Function, byteLengthSumOfMembers: Byte): void;
    takeOne(memberName: string, dataClassType: any, initValues: number[]): any;
    static getAccessor(memberName: string, componentClass: Function): Accessor;
    static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
    static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass: Function): Byte;
    static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass: Function): Byte;
    static getCompositionTypeOfMember(memberName: string, componentClass: Function): CompositionTypeEnum | null;
    static getComponentTypeOfMember(memberName: string, componentClass: Function): ComponentTypeEnum | null;
    registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType: Function, componentType: ComponentTypeEnum, initValues: number[]): void;
    submitToAllocation(): void;
}
export interface ComponentConstructor {
    new (entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository): Component;
    process({ componentTid, processStage, instanceIDBufferUid, processApproach, componentRepository }: {
        componentTid: ComponentTID;
        processStage: ProcessStageEnum;
        instanceIDBufferUid: CGAPIResourceHandle;
        processApproach: ProcessApproachEnum;
        componentRepository: ComponentRepository;
        strategy: WebGLStrategy;
    }): void;
    updateComponentsOfEachProcessStage(componentTid: ComponentTID, processStage: ProcessStageEnum, componentRepository: ComponentRepository): void;
}
