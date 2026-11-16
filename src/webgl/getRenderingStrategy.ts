import { ProcessApproach, type ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import type { Engine } from '../foundation/system/Engine';
import { ModuleManager } from '../foundation/system/ModuleManager';
import type { RnWebGL } from './main';
import type { WebGLStrategy } from './WebGLStrategy';

const getRenderingStrategy = (engine: Engine, processApproach: ProcessApproachEnum): WebGLStrategy => {
  // Strategy
  const moduleName = 'webgl';
  const moduleManager = ModuleManager.getInstance();
  const webglModule = moduleManager.getModule(moduleName)! as RnWebGL;
  if (ProcessApproach.isWebGL2Approach(processApproach)) {
    return webglModule.WebGLStrategyWebGL2.init(engine);
  }
  throw new Error(`No WebGL rendering strategy for process approach "${processApproach.str}".`);
};

export default getRenderingStrategy;
