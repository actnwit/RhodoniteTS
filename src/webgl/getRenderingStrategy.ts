import { ProcessApproach, type ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import { ModuleManager } from '../foundation/system/ModuleManager';
import type { WebGLStrategy } from './WebGLStrategy';

const getRenderingStrategy = (processApproach: ProcessApproachEnum): WebGLStrategy => {
  // Strategy
  const moduleName = 'webgl';
  const moduleManager = ModuleManager.getInstance();
  const webglModule = moduleManager.getModule(moduleName)! as any;
  if (ProcessApproach.isDataTextureApproach(processApproach)) {
    return webglModule.WebGLStrategyDataTexture.getInstance();
  }
  if (ProcessApproach.isUniformApproach(processApproach)) {
    return webglModule.WebGLStrategyUniform.getInstance();
  }
  return webglModule.WebGLStrategyUniform.getInstance();
};

export default getRenderingStrategy;
