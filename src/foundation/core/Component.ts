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
import { ProcessApproach, ProcessApproachEnum } from '../definitions/ProcessApproach';
import ComponentRepository from './ComponentRepository';
import Config from './Config';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableRowMajarMatrix44 from '../math/MutableRowMajarMatrix44';
import { CompositionType } from '../definitions/CompositionType';
import MutableMatrix33 from '../math/MutableMatrix33';
import Matrix33 from '../math/Matrix33';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import MutableVector4 from '../math/MutableVector4';
import MutableQuaternion from '../math/MutableQuaterion';
import WebGLStrategy from '../../webgl/WebGLStrategy';

type MemberInfo = {memberName: string, bufferUse: BufferUseEnum, dataClassType: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, initValues: number[]};

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

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
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
        if (Component.__componentsOfProcessStages.get(stage) == null) {
          Component.__componentsOfProcessStages.set(stage, new Int32Array(Config.maxEntityNumber));
          Component.__dirtyOfArrayOfProcessStages.set(stage, false);
          Component.__lengthOfArrayOfProcessStages.set(stage, 0);
        }
      }
    });
    this.__memoryManager = MemoryManager.getInstance();
    this.__entityRepository = entityRepository;
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

  static isExistProcessStageMethod(componentType: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository) {
    const component = componentRepository.getComponent(componentType, 0)!;
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

  static process({componentType, processStage, processApproach, componentRepository, strategy}: {
    componentType: typeof Component,
    processStage: ProcessStageEnum,
    processApproach: ProcessApproachEnum,
    componentRepository: ComponentRepository,
    strategy: WebGLStrategy
  }
    ) {
    if (!Component.isExistProcessStageMethod(componentType, processStage, componentRepository)) {
      return;
    }

    const array = this.__componentsOfProcessStages.get(processStage)!;
    for (let i=0; i<array.length; ++i) {
      if (array[i] === Component.invalidComponentSID) {
        break;
      }
      const componentSid = array[i];
      const component = componentRepository.getComponent(componentType, componentSid)!;
      (component as any)[processStage.getMethodName()]({
        processStage,
        processApproach,
        strategy
      });
    }
  }

  static updateComponentsOfEachProcessStage(componentClass: typeof Component, processStage: ProcessStageEnum, componentRepository: ComponentRepository) {
    if (!Component.isExistProcessStageMethod(componentClass, processStage, componentRepository)) {
      return;
    }

    const component = componentRepository.getComponentFromComponentTID(this.componentTID, 0)!;
    const dirty = Component.__componentsOfProcessStages.get(processStage)!
    if (dirty) {
      const components = componentRepository.getComponentsWithType(componentClass)!;
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

  static takeBufferViewer(bufferUse: BufferUseEnum, componentClass:Function, byteLengthSumOfMembers: Byte, count: Count) {
    const buffer = MemoryManager.getInstance().getBuffer(bufferUse);

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

  takeOne(memberName: string, dataClassType: any, initValues: number[]): any {
    if (!(this as any)['_'+memberName].isDummy()) {
      return;
    }
    let taken = Component.__accessors.get(this.constructor)!.get(memberName)!.takeOne();
    if (dataClassType === Matrix44 || dataClassType === MutableMatrix44) {
      (this as any)['_'+memberName] = new dataClassType(taken, false, true);
    } else if (dataClassType === RowMajarMatrix44 || dataClassType === MutableRowMajarMatrix44) {
      (this as any)['_'+memberName] = new dataClassType(taken, true);
    } else {
      (this as any)['_'+memberName] = new dataClassType(taken);
    }

    for (let i=0; i<(this as any)['_'+memberName].v.length; ++i) {
      (this as any)['_'+memberName].v[i] = initValues[i];
    }

    return null;
  }

  static getAccessor(memberName: string, componentClass:Function): Accessor {
    return this.__accessors.get(componentClass)!.get(memberName)!;
  }

  static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass:Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count) {
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

  registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType:Function, componentType: ComponentTypeEnum, initValues: number[]) {
    if (!Component.__memberInfo.has(this.constructor)) {
      Component.__memberInfo.set(this.constructor, []);
    }
    const memberInfoArray = Component.__memberInfo.get(this.constructor);

    memberInfoArray!.push({bufferUse:bufferUse, memberName:memberName, dataClassType:dataClassType,
      compositionType:(dataClassType as any).compositionType, componentType:componentType, initValues:initValues});
  }

  submitToAllocation(count: Count = Config.maxEntityNumber) {
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
          Component.takeBufferViewer(bufferUse, componentClass, byteLengthSumOfMembers.get(bufferUse)!, count);
        }
      }

      for (let bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        infoArray.forEach(info=>{
          Component.takeAccessor(info.bufferUse, info.memberName, componentClass, info.compositionType, info.componentType, count);
        });
      }
    }

    const member = Component.__members.get(componentClass)!;


    // takeOne
    for (let bufferUse of member.keys()) {
      const infoArray = member.get(bufferUse)!;
      infoArray.forEach(info=>{
        this.takeOne(info.memberName, info.dataClassType, info.initValues);
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

