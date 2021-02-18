import { ProcessApproach, ProcessApproachEnum } from '../foundation/definitions/ProcessApproach';
import WebGLStrategy from './WebGLStrategy';
import WebGLStrategyUniform from './WebGLStrategyUniform';
import WebGLStrategyFastest from './WebGLStrategyFastest';

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (ProcessApproach.isFastestApproach(processApproach)) {
    return WebGLStrategyFastest.getInstance();
  } else if (ProcessApproach.isUniformApproach(processApproach)) {
    return WebGLStrategyUniform.getInstance();
  }
  return WebGLStrategyUniform.getInstance();
}

export default getRenderingStrategy;
