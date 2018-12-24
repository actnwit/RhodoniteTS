import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';

export default class Component {
  private _component_sid: number;
  private __isAlive: Boolean;
  protected __entityUid: EntityUID;
  protected __memoryManager: MemoryManager;
  protected __entityRepository: EntityRepository;

  constructor(entityUid: EntityUID) {
    this.__entityUid = entityUid
    this._component_sid = 0;
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

  static get byteSizeOfThisComponent() {
    return 0;
  }

  static setupBufferView() {
  }

  registerDependency(component: Component, isMust: boolean) {

  }

  $create() {
    // Define process dependencies with other components.
    // If circular depenencies are detected, the error will be repoated.

    // this.registerDependency(TransformComponent);
  }

  $load() {
    
  }

  $mount() {

  }

  $logic() {

  }

  $prerender(instanceIDBufferUid: CGAPIResourceHandle) {

  }

  $render() {

  }

  $unmount() {
    
  }

  $discard() {
    
  }
}

export interface ComponentConstructor {
  new(entityUid: EntityUID): Component;
  setupBufferView(): void;
}
