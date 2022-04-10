export class ModuleManager {
  private static __instance: ModuleManager;
  private __modules: Map<string, any> = new Map();
  private constructor() {}

/* eslint-disable prettier/prettier */
  async loadModule(moduleName: string, options?: {
    wasm?: string
  }): Promise<any> {
    let module: any;
    if (moduleName.toLowerCase() === 'webgl') {
      module = await (await import(/* webpackChunkName: "webgl" */'../../webgl/main')).default;
    } else if (moduleName.toLowerCase() === 'effekseer') {
      module = await (await import(/* webpackChunkName: "effekseer" */'../../effekseer/main')).Effekseer;
      module.EffekseerComponent.wasmModuleUri = options?.wasm;
    } else if (moduleName.toLowerCase() === 'sparkgear') {
      module = await (await import(/* webpackChunkName: "sparkgear" */'../../sparkgear/main')).default;
    } else if (moduleName.toLowerCase() === 'pbr') {
      module = await (await import(/* webpackChunkName: "pbr" */'../../pbr/main')).default;
    } else if (moduleName.toLowerCase() === 'xr') {
      module = await (await import(/* webpackChunkName: "xr" */'../../xr/main')).default;
    }
    this.__modules.set(moduleName, module);
    // console.log('Module Loaded:', module);

    return module;
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
