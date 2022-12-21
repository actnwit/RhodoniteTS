export declare class ModuleManager {
    private static __instance;
    private __modules;
    private constructor();
    loadModule(moduleName: string, options?: {
        wasm?: string;
    }): Promise<any>;
    getModule(moduleName: string): any;
    static getInstance(): ModuleManager;
}
