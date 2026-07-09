/**
 * A singleton module manager that handles dynamic loading and management of various modules
 * such as WebGL, WebGPU, Effekseer, PBR, and XR modules.
 *
 * This class provides a centralized way to load modules on-demand and retrieve them when needed,
 * helping to optimize bundle size by enabling code splitting.
 */
export declare class ModuleManager {
    private static __instance;
    private __modules;
    private constructor();
    /**
     * Dynamically loads a module by name and stores it in the internal module registry.
     * Supports loading WebGL, WebGPU, Effekseer, PBR, and XR modules with code splitting.
     *
     * @param moduleName - The name of the module to load (case-insensitive).
     *                     Supported modules: 'webgl', 'webgpu', 'effekseer', 'pbr', 'xr'
     * @param options - Optional configuration object for module loading
     * @param options.wasm - WASM module URI, currently used only for Effekseer module
     * @param options.wasmWebGL - WebGL backend WASM module URI for Effekseer
     * @param options.nativeScriptWebGL - WebGL backend native script URI for Effekseer
     * @param options.wasmWebGPU - WebGPU backend WASM module URI for Effekseer
     * @param options.nativeScriptWebGPU - WebGPU backend native script URI for Effekseer
     * @returns A promise that resolves to the loaded module
     * @throws Will throw an error if the module fails to load
     *
     * @example
     * ```typescript
     * const moduleManager = ModuleManager.getInstance();
     * const webglModule = await moduleManager.loadModule('webgl');
     * const effekseerModule = await moduleManager.loadModule('effekseer', {
     *   wasm: '/path/to/effekseer-webgl.wasm',
     *   nativeScript: '/path/to/effekseer-webgl.js'
     * });
     * ```
     */
    loadModule(moduleName: string, options?: {
        wasm?: string;
        nativeScript?: string;
        wasmWebGL?: string;
        nativeScriptWebGL?: string;
        wasmWebGPU?: string;
        nativeScriptWebGPU?: string;
    }): Promise<any>;
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
    getModule(moduleName: string): any;
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
    static getInstance(): ModuleManager;
}
