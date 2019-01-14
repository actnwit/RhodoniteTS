import { ProcessApproach, ProcessApproachEnum } from "../../definitions/ProcessApproach";
import WebGLStrategyUBO from "./WebGLStrategyUBO";
import WebGLStrategyTransformFeedback from "./WebGLStrategyTransformFeedback";
import WebGLStrategyDataTexture from "./WebGLStrategyDataTexture";
import WebGLStrategy from "./WebGLStrategy";
import WebGLStrategyUniform from "./WebGLStrategyUniform";

const getRenderingStrategy = function (processApproach: ProcessApproachEnum): WebGLStrategy {
  // Strategy
  if (processApproach === ProcessApproach.UBOWebGL2) {
    return WebGLStrategyUBO.getInstance();
  } else if (processApproach === ProcessApproach.TransformFeedbackWebGL2) {
    return WebGLStrategyTransformFeedback.getInstance();
  } else if (processApproach === ProcessApproach.UniformWebGL1) {
    return WebGLStrategyUniform.getInstance();
  } else {
    return WebGLStrategyDataTexture.getInstance();
  }
}

export default getRenderingStrategy;
