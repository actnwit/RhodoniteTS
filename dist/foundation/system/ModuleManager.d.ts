export default class ModuleManager {
    private static __instance;
    private __modules;
    private constructor();
    loadModule(moduleName: string): Promise<any>;
    getModule(moduleName: string): any;
    static getInstance(): ModuleManager;
}
