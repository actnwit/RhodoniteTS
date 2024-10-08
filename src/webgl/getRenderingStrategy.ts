import { ProcessApproach, ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import { WebGLStrategy } from './WebGLStrategy';
import { ModuleManager } from '../foundation/system/ModuleManager';

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  const moduleName = 'webgl';
  const moduleManager = ModuleManager.getInstance();
  const webglModule = moduleManager.getModule(moduleName)! as any;
  if (ProcessApproach.isDataTextureApproach(processApproach)) {
    return webglModule.WebGLStrategyDataTexture.getInstance();
  } else if (ProcessApproach.isUniformApproach(processApproach)) {
    return webglModule.WebGLStrategyUniform.getInstance();
  }
  return webglModule.WebGLStrategyUniform.getInstance();
};

export default getRenderingStrategy;
