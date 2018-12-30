import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import { BufferUseEnum } from '../definitions/BufferUse';
import { CompositionTypeEnum, ComponentTypeEnum } from '../main';

export default class Component {
  private _component_sid: number;
  private static __bufferViews: {[s: string]: BufferView} = {};
  private static __accessors: { [s: string]: Accessor } = {};

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

  static get byteSizeOfThisComponent() {
    return 0;
  }

  static setupBufferView() {
  }

  registerDependency(component: Component, isMust: boolean) {

  }

  static takeBufferViewer(bufferUse: BufferUseEnum) {
    const buffer = MemoryManager.getInstance().getBuffer(bufferUse);
    const count = EntityRepository.getMaxEntityNumber();
    this.__bufferViews[bufferUse.toString()] =
    buffer.takeBufferView({byteLengthToNeed: this.byteSizeOfThisComponent * count, byteStride: 0, isAoS: false});
  }

  static takeOne(memberName: string): any {
    return this.__accessors[memberName].takeOne();
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
