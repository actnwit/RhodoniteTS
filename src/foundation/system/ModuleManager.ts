/**
 * A singleton module manager that handles dynamic loading and management of various modules
 * such as WebGL, WebGPU, Effekseer, PBR, and XR modules.
 *
 * This class provides a centralized way to load modules on-demand and retrieve them when needed,
 * helping to optimize bundle size by enabling code splitting.
 */
export class ModuleManager {
  private static __instance: ModuleManager;
  private __modules: Map<string, any> = new Map();
  private constructor() {}

  /* eslint-disable prettier/prettier */
  /**
   * Dynamically loads a module by name and stores it in the internal module registry.
   * Supports loading WebGL, WebGPU, Effekseer, PBR, and XR modules with code splitting.
   *
   * @param moduleName - The name of the module to load (case-insensitive).
   *                     Supported modules: 'webgl', 'webgpu', 'effekseer', 'pbr', 'xr'
   * @param options - Optional configuration object for module loading
   * @param options.wasm - WASM module URI, currently used only for Effekseer module
   * @returns A promise that resolves to the loaded module
   * @throws Will throw an error if the module fails to load
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * const webglModule = await moduleManager.loadModule('webgl');
   * const effekseerModule = await moduleManager.loadModule('effekseer', {
   *   wasm: '/path/to/effekseer.wasm'
   * });
   * ```
   */
  async loadModule(
    moduleName: string,
    options?: {
      wasm?: string;
    }
  ): Promise<any> {
    let module: any;
    if (moduleName.toLowerCase() === 'webgl') {
      module = await (await import(/* webpackChunkName: "webgl" */ '../../webgl/main')).default;
    } else if (moduleName.toLowerCase() === 'webgpu') {
      module = await (await import(/* webpackChunkName: "webgpu" */ '../../webgpu/main')).default;
    } else if (moduleName.toLowerCase() === 'effekseer') {
      module = await (await import(/* webpackChunkName: "effekseer" */ '../../effekseer/main')).Effekseer;
      module.EffekseerComponent.wasmModuleUri = options?.wasm;
    } else if (moduleName.toLowerCase() === 'pbr') {
      module = await (await import(/* webpackChunkName: "pbr" */ '../../pbr/main')).default;
    } else if (moduleName.toLowerCase() === 'xr') {
      module = await (await import(/* webpackChunkName: "xr" */ '../../xr/main')).default;
    }
    this.__modules.set(moduleName, module);
    // Logger.log('Module Loaded:', module);

    return module;
  }

  /**
   * Retrieves a previously loaded module from the internal registry.
   *
   * @param moduleName - The name of the module to retrieve
   * @returns The loaded module if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * const webglModule = moduleManager.getModule('webgl');
   * if (webglModule) {
   *   // Use the module
   * }
   * ```
   */
  getModule(moduleName: string) {
    return this.__modules.get(moduleName);
  }

  /**
   * Gets the singleton instance of ModuleManager.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton ModuleManager instance
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * ```
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new ModuleManager();
    }

    return this.__instance;
  }
}
