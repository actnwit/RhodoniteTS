import { ModuleManager } from '../foundation/system/ModuleManager';
import type { WebXRSystem } from './WebXRSystem';

export function getWebXRSystem(): WebXRSystem {
  const moduleName = 'xr';
  const moduleManager = ModuleManager.getInstance();
  const xrModule = moduleManager.getModule(moduleName)! as any;
  const webXRSystem: WebXRSystem = xrModule.WebXRSystem.getInstance();
  return webXRSystem;
}
