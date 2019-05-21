import { ProcessApproach, ProcessApproachEnum } from "../foundation/definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyTransformFeedback from "./WebGLStrategyTransformFeedback";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";
import WebGLStrategy from "./WebGLStrategy";
import WebGLStrategyUniform from "./WebGLStrategyUniform";

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (processApproach.index === ProcessApproach.UBOWebGL2.index) {
    return WebGLStrategyUBO.getInstance();
  } else if (processApproach.index === ProcessApproach.TransformFeedbackWebGL2.index) {
    return WebGLStrategyTransformFeedback.getInstance();
  } else if (processApproach.index === ProcessApproach.UniformWebGL1.index ||
    processApproach.index === ProcessApproach.UniformWebGL2.index) {
    return WebGLStrategyUniform.getInstance();
  } else {
    return WebGLStrategyDataTexture.getInstance();
  }
}

export default getRenderingStrategy;
