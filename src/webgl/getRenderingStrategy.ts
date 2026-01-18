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
  if (ProcessApproach.isDataTextureApproach(processApproach)) {
    return webglModule.WebGLStrategyDataTexture.init(engine);
  }
  if (ProcessApproach.isUniformApproach(processApproach)) {
    return webglModule.WebGLStrategyUniform.init(engine);
  }
  return webglModule.WebGLStrategyUniform.init(engine);
};

export default getRenderingStrategy;
