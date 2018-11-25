export default class Component {
  private _component_sid: number;
  private __isAlive: Boolean;

  constructor() {
    this._component_sid = 0;
    this.__isAlive = true;
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
  new(): Component;
}
