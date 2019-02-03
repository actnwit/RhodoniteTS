export default class ModuleManager {
  private static __instance: ModuleManager;
  private __modules:Map<string, any> = new Map()
  private constructor() {}

  async loadModule(moduleName: string) {
    let module;
    if (moduleName.toLowerCase() === 'webgl') {
      module = await import(/* webpackChunkName: "webgl" */'../../webgl/main');
    } else if (moduleName.toLowerCase() === 'effekseer') {
      module = await import(/* webpackChunkName: "effekseer" */'../../effekseer/main');
    }
    this.__modules.set(moduleName, module);
    console.log('Module Loaded:', module);
  }

  getModule(moduleName: string) {
    return this.__modules.get(moduleName).default;
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new ModuleManager();
    }

    return this.__instance;
  }
}
