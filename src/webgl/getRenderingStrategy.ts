import { ProcessApproach, ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import { WebGLStrategy } from './WebGLStrategy';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (ProcessApproach.isDataTextureApproach(processApproach)) {
    return WebGLStrategyDataTexture.getInstance();
  } else if (ProcessApproach.isUniformApproach(processApproach)) {
    return WebGLStrategyUniform.getInstance();
  }
  return WebGLStrategyUniform.getInstance();
};

export default getRenderingStrategy;
