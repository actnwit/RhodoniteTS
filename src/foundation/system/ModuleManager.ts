export default class ModuleManager {
  private static __instance: ModuleManager;
  private __modules:Map<string, any> = new Map()
  private constructor() {}

  async loadModule(moduleName: string, basePath: string = './') {
    const module = await import(/* webpackChunkName: "webgl" */'../../webgl/main');
    this.__modules.set(moduleName, module);
    console.log('Module Loaded:', module);
  }

  getModule(moduleName: string) {
    return this.__modules.get(moduleName);
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new ModuleManager();
    }

    return this.__instance;
  }
}
