import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { BufferUseEnum, BufferUse } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';

type MemberInfo = {memberName: string, bufferUse: BufferUseEnum, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum};

export default class Component {
  private _component_sid: number;
  private static __bufferViews: {[s: string]: BufferView} = {};
  private static __accessors: { [s: string]: Accessor } = {};
  private static __byteLengthSumOfMembers:{[s:string]: Byte} = {};

  private static __memberInfoArray: MemberInfo[] = [];

  private __isAlive: Boolean;
  protected __entityUid: EntityUID;
  protected __memoryManager: MemoryManager;
  protected __entityRepository: EntityRepository;

  constructor(entityUid: EntityUID, componentSid: ComponentSID) {
    this.__entityUid = entityUid
    this._component_sid = componentSid;
    this.__isAlive = true;

    this.__memoryManager = MemoryManager.getInstance();
    this.__entityRepository = EntityRepository.getInstance();
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

  static getByteLengthSumOfMembers(bufferUse: BufferUseEnum) {
    return this.__byteLengthSumOfMembers[bufferUse.toString()];
  }

  static setupBufferView() {
  }

  registerDependency(component: Component, isMust: boolean) {

  }

  static takeBufferViewer(bufferUse: BufferUseEnum, byteLengthSumOfMembers: Byte) {
    const buffer = MemoryManager.getInstance().getBuffer(bufferUse);
    const count = EntityRepository.getMaxEntityNumber();
    this.__bufferViews[bufferUse.toString()] =
    buffer.takeBufferView({byteLengthToNeed: byteLengthSumOfMembers * count, byteStride: 0, isAoS: false});
  }

  static takeOne(memberName: string): any {
    return this.__accessors[memberName].takeOne();
  }

  static getAccessor(memberName: string): Accessor {
    return this.__accessors[memberName];
  }

  static takeAccessor(bufferUse: BufferUseEnum, memberName: string, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    const count = EntityRepository.getMaxEntityNumber();
    this.__accessors[memberName] = this.__bufferViews[bufferUse.toString()].takeAccessor({compositionType: compositionType, componentType, count: count});
  }

  static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum): Byte {
    return this.__bufferViews[bufferUse.toString()]!.byteOffset;
  }

  static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string): Byte {
    return this.__accessors[memberName].byteOffsetInBuffer;
  }

  static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string): Byte {
    return this.__accessors[memberName].byteOffsetInBufferView;
  }

  static getCompositionTypeOfMember(memberName: string): CompositionTypeEnum | null {
    const info = this.__memberInfoArray.find(info=>{
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.compositionType;
    } else {
      return null;
    }
  }

  static getComponentTypeOfMember(memberName: string): ComponentTypeEnum | null {
    const info = this.__memberInfoArray.find(info=>{
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.componentType;
    } else {
      return null;
    }
  }
  static registerMember(bufferUse: BufferUseEnum, memberName: string, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum) {
    this.__memberInfoArray.push({bufferUse, memberName, compositionType, componentType})
  }

  static submitToAllocation() {
    const members:{[s:string]: Array<MemberInfo>} = {};

    this.__memberInfoArray.forEach(info=>{
      members[info.bufferUse.toString()] = [];
    });

    this.__memberInfoArray.forEach(info=>{
      members[info.bufferUse.toString()].push(info);
    });

    for (let bufferUseName in members) {
      const infoArray = members[bufferUseName];
      this.__byteLengthSumOfMembers[bufferUseName] = 0;
      infoArray.forEach(info=>{
        this.__byteLengthSumOfMembers[bufferUseName] += info.compositionType.getNumberOfComponents() * info.componentType.getSizeInBytes()
      });
      if (infoArray.length > 0) {
        this.takeBufferViewer(BufferUse.from({str: bufferUseName}), this.__byteLengthSumOfMembers[bufferUseName]);
      }
    }

    for (let bufferUseName in members) {
      const infoArray = members[bufferUseName];
      this.__byteLengthSumOfMembers[bufferUseName] = 0;
      infoArray.forEach(info=>{
        this.takeAccessor(info.bufferUse, info.memberName, info.compositionType, info.componentType);
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
  setupBufferView(): void;
}
