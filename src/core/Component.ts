import MemoryManager from '../core/MemoryManager';

export default class Component {
  private _component_sid: number;
  private __isAlive: Boolean;
  protected __entityUid: EntityUID;
  protected __memoryManager: MemoryManager;

  constructor(entityUid: EntityUID) {
    this.__entityUid = entityUid
    this._component_sid = 0;
    this.__isAlive = true;

    this.__memoryManager = MemoryManager.getInstance();
  }

  static get componentTID() {
    return 0;
  }

  get componentSID() {
    return this._component_sid;
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

  $updateLogic() {

  }

  $updateForRendering() {

  }

  $render() {

  }

  $discard() {
    
  }
}

export interface ComponentConstructor {
  new(entityUid: EntityUID): Component;
}
