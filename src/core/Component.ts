import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { BufferUseEnum, BufferUse } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';
import Quaternion from '../math/Quaternion';
import Matrix44 from '../math/Matrix44';
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import { ProcessStage, ProcessStageEnum } from '../definitions/ProcessStage';
import ComponentRepository from './ComponentRepository';

type MemberInfo = {memberName: string, bufferUse: BufferUseEnum, dataClassType: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum};

export default class Component {
  private _component_sid: number;
  static readonly invalidComponentSID = -1;
  protected __currentProcessStage: ProcessStageEnum = ProcessStage.Create;
  protected static __componentsOfProcessStages: Map<ProcessStageEnum, Int32Array> = new Map();
  protected static __lengthOfArrayOfProcessStages: Map<ProcessStageEnum, number> = new Map();
  protected static __dirtyOfArrayOfProcessStages: Map<ProcessStageEnum, boolean> = new Map();
  private static __bufferViews:Map<Function, Map<BufferUseEnum, BufferView>> = new Map();
  private static __accessors: Map<Function, Map<string, Accessor>> = new Map();
  private static __byteLengthSumOfMembers: Map<Function, Map<BufferUseEnum, Byte >> = new Map();

  private static __memberInfo: Map<Function, MemberInfo[]> = new Map();
  private static __members:Map<Function, Map<BufferUseEnum, Array<MemberInfo>>> = new Map();

  private __isAlive: Boolean;
  protected __entityUid: EntityUID;
  protected __memoryManager: MemoryManager;
  protected __entityRepository: EntityRepository;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    this.__entityUid = entityUid
    this._component_sid = componentSid;
    this.__isAlive = true;

    const stages = [
      ProcessStage.Create,
      ProcessStage.Load,
      ProcessStage.Mount,
      ProcessStage.Logic,
      ProcessStage.PreRender,
      ProcessStage.Render,
      ProcessStage.Unmount,
      ProcessStage.Discard
    ];

    stages.forEach(stage=>{
      if (this.isExistProcessStageMethod(stage)) {
        Component.__componentsOfProcessStages.set(stage, new Int32Array(EntityRepository.getMaxEntityNumber()));
        Component.__dirtyOfArrayOfProcessStages.set(stage, false);
        Component.__lengthOfArrayOfProcessStages.set(stage, 0);
      }
    });
    this.__memoryManager = MemoryManager.getInstance();
    this.__entityRepository = EntityRepository.getInstance();
  }

  moveStageTo(processStage: ProcessStageEnum) {
    Component.__dirtyOfArrayOfProcessStages.set(this.__currentProcessStage, true);
    Component.__dirtyOfArrayOfProcessStages.set(processStage, true);
    this.__currentProcessStage = processStage;
  }

  static get componentTID() {
    return 0;
  }

  get componentSID() {
    return this._component_sid;
  }

  get entityUID() {
    return this.__entityUid;
  }

  static isExistProcessStageMethod(componentTid: ComponentTID, processStage: ProcessStageEnum) {
    const componentRepository = ComponentRepository.getInstance();
    const component = componentRepository.getComponent(componentTid, 0)!;
    if (component == null) {
      return false;
    }
    if ((component as any)[processStage.getMethodName()] == null) {
      return false;
    }

    return true;
  }

  isExistProcessStageMethod(processStage: ProcessStageEnum) {
    if ((this as any)[processStage.getMethodName()] == null) {
      return false;
    }

    return true;
  }

  static process(componentTid: ComponentTID, processStage: ProcessStageEnum, instanceIDBufferUid: CGAPIResourceHandle) {
    if (!Component.isExistProcessStageMethod(componentTid, processStage)) {
      return;
    }

    const componentRepository = ComponentRepository.getInstance();
    const array = this.__componentsOfProcessStages.get(processStage)!;
    for (let i=0; i<array.length; ++i) {
      if (array[i] === Component.invalidComponentSID) {
        break;
      }
      const componentSid = array[i];
      const component = componentRepository.getComponent(componentTid, componentSid)!;
      (component as any)[processStage.getMethodName()](processStage, instanceIDBufferUid);
    }
  }

  static updateComponentsOfEachProcessStage(componentTid: ComponentTID, processStage: ProcessStageEnum) {
    if (!Component.isExistProcessStageMethod(componentTid, processStage)) {
      return;
    }

    const componentRepository = ComponentRepository.getInstance();
    const component = componentRepository.getComponent(this.componentTID, 0)!;
    const dirty = Component.__componentsOfProcessStages.get(processStage)!
    if (dirty) {
      const components = ComponentRepository.getInstance().getComponentsWithType(componentTid)!;
      const array = Component.__componentsOfProcessStages.get(processStage)!;
      let count = 0;
      for (let i=0; i<components.length; ++i) {
        const component = components[i];
        if (processStage === component.__currentProcessStage) {
          array[count++] = component.componentSID;
        }
      }
      array[count] = Component.invalidComponentSID;
    }
  }

  static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function) {
    const byteLengthSumOfMembers = this.__byteLengthSumOfMembers.get(componentClass)!
    return byteLengthSumOfMembers.get(bufferUse)!;
  }

  static setupBufferView() {
  }

  registerDependency(component: Component, isMust: boolean) {

  }

  static takeBufferViewer(bufferUse: BufferUseEnum, componentClass:Function, byteLengthSumOfMembers: Byte) {
    const buffer = MemoryManager.getInstance().getBuffer(bufferUse);
    const count = EntityRepository.getMaxEntityNumber();

    if (!this.__bufferViews.has(componentClass)) {
      this.__bufferViews.set(componentClass, new Map())
    }

    const bufferViews = this.__bufferViews.get(componentClass)!;

    if (!bufferViews.has(bufferUse)) {
      bufferViews.set(bufferUse,
        buffer.takeBufferView({byteLengthToNeed: byteLengthSumOfMembers * count, byteStride: 0, isAoS: false})
        );
    }
  }

  takeOne(memberName: string, dataClassType: any): any {
    if (!(this as any)['_'+memberName].isDummy()) {
      return;
    }
    let taken = Component.__accessors.get(this.constructor)!.get(memberName)!.takeOne();
    if (dataClassType === Matrix44) {
      (this as any)['_'+memberName] = new dataClassType(taken, false, true);
    } else if (dataClassType === RowMajarMatrix44) {
      (this as any)['_'+memberName] = new dataClassType(taken, true);
    } else {
      (this as any)['_'+memberName] = new dataClassType(taken);
    }
    return null;
  }

  static getAccessor(memberName: string, componentClass:Function): Accessor {
    return this.__accessors.get(componentClass)!.get(memberName)!;
  }

  static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass:Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    const count = EntityRepository.getMaxEntityNumber();
    if (!this.__accessors.has(componentClass)) {
      this.__accessors.set(componentClass, new Map());
    }

    const accessors = this.__accessors.get(componentClass)!;

    if (!accessors.has(memberName)) {
      const bufferViews = this.__bufferViews.get(componentClass)!
      accessors.set(memberName,
        bufferViews.get(bufferUse)!.takeAccessor(
          {compositionType: compositionType, componentType, count: count})
      );
    }
  }

  static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass:Function): Byte {
    return this.__bufferViews.get(componentClass)!.get(bufferUse)!.byteOffset;
  }

  static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass:Function): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!.byteOffsetInBuffer;
  }

  static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass:Function): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!.byteOffsetInBufferView;
  }

  static getCompositionTypeOfMember(memberName: string, componentClass:Function): CompositionTypeEnum | null {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info=>{
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.compositionType;
    } else {
      return null;
    }
  }

  static getComponentTypeOfMember(memberName: string, componentClass:Function): ComponentTypeEnum | null {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info=>{
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.componentType;
    } else {
      return null;
    }
  }

  registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType:Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    if (!Component.__memberInfo.has(this.constructor)) {
      Component.__memberInfo.set(this.constructor, []);
    }
    const memberInfoArray = Component.__memberInfo.get(this.constructor);
    memberInfoArray!.push({bufferUse, memberName, dataClassType, compositionType, componentType})
  }

  submitToAllocation() {
    const componentClass = this.constructor;
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;


    if (this._component_sid <= 1) {
      if (!Component.__members.has(componentClass)) {
        Component.__members.set(componentClass, new Map());
      }
      const member = Component.__members.get(componentClass)!;
      memberInfoArray.forEach(info=>{
        member.set(info.bufferUse, []);
      });
      memberInfoArray.forEach(info=>{
        member.get(info.bufferUse)!.push(info);
      });

      for (let bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        const bufferUseName = bufferUse.toString();
        if (!Component.__byteLengthSumOfMembers.has(componentClass)) {
          Component.__byteLengthSumOfMembers.set(componentClass, new Map());
        }
        let byteLengthSumOfMembers = Component.__byteLengthSumOfMembers.get(componentClass)!;
        if (!byteLengthSumOfMembers.has(bufferUse)) {
          byteLengthSumOfMembers.set(bufferUse, 0);
        }
        infoArray.forEach(info=>{
          byteLengthSumOfMembers.set(bufferUse,
            byteLengthSumOfMembers.get(bufferUse)! +
            info.compositionType.getNumberOfComponents() * info.componentType.getSizeInBytes()
          );
        });
        if (infoArray.length > 0) {
          Component.takeBufferViewer(bufferUse, componentClass, byteLengthSumOfMembers.get(bufferUse)!);
        }
      }

      for (let bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        infoArray.forEach(info=>{
          Component.takeAccessor(info.bufferUse, info.memberName, componentClass, info.compositionType, info.componentType);
        });
      }
    }

    const member = Component.__members.get(componentClass)!;


    // takeOne
    for (let bufferUse of member.keys()) {
      const infoArray = member.get(bufferUse)!;
      infoArray.forEach(info=>{
        this.takeOne(info.memberName, info.dataClassType);
      });
    }

  }

  // $create() {
  //   // Define process dependencies with other components.
  //   // If circular depenencies are detected, the error will be repoated.

  //   // this.registerDependency(TransformComponent);
  // }

  // $load() {}

  // $mount() {}

  // $logic() {}

  // $prerender(instanceIDBufferUid: CGAPIResourceHandle) {}

  // $render() {}

  // $unmount() {}

  // $discard() {}
}

export interface ComponentConstructor {
  new(entityUid: EntityUID, componentSid: ComponentSID): Component;
  process(componentTid: ComponentTID, processStage: ProcessStageEnum, instanceIDBufferUid: CGAPIResourceHandle): void;
  updateComponentsOfEachProcessStage(componentTid: ComponentTID, processStage: ProcessStageEnum): void;
}
